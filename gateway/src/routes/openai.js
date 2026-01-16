import { authenticateUser } from '../auth/userAuth.js';
import { UserPolicy } from '../db/models/UserPolicy.js';
import { SystemPolicy } from '../db/models/SystemPolicy.js';
import { RequestLog } from '../db/models/RequestLog.js';
import { determineRequestedTier, resolveAutoTier, validateAndDowngrade } from '../policy/routing.js';
import { checkLimits, reserveRequest, updateTokens } from '../policy/limits.js';
import { callGemini, estimatePromptTokens } from '../provider/gemini.js';
import { getCurrentDay, getCurrentMonth } from '../utils/time.js';
import { generateRequestId } from '../utils/requestId.js';
import { config } from '../env.js';

export async function registerOpenAIRoutes(fastify) {
    /**
     * POST /v1/chat/completions
     * OpenAI-compatible endpoint for tools like Continue/Cursor
     */
    fastify.post('/v1/chat/completions', {
        preHandler: authenticateUser,
        handler: async (request, reply) => {
            const startTime = Date.now();
            const requestId = generateRequestId();
            const userId = request.userId;
            const { messages, model: requestedModel } = request.body;

            // Validate messages
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return reply.code(400).send({
                    error: {
                        message: 'messages array is required and must not be empty',
                        type: 'invalid_request_error',
                        param: 'messages',
                        code: null
                    }
                });
            }

            const day = getCurrentDay();
            const month = getCurrentMonth();

            try {
                // Load policies
                const userPolicy = await UserPolicy.findOne({ userId });
                if (!userPolicy) {
                    return reply.code(404).send({
                        error: {
                            message: `No policy found for user: ${userId}`,
                            type: 'invalid_request_error',
                            param: 'user',
                            code: 'user_not_found'
                        }
                    });
                }

                const systemPolicy = await SystemPolicy.findOne({ key: 'system' });
                if (!systemPolicy) {
                    return reply.code(500).send({
                        error: {
                            message: 'System policy not found',
                            type: 'api_error',
                            param: null,
                            code: 'system_error'
                        }
                    });
                }

                // Determine tier from model name if possible, otherwise default/auto
                // internal tiers: 'cheap', 'premium', 'auto'
                // mapped models: 'gemini-1.5-flash' -> cheap, 'gemini-1.5-pro' -> premium
                let requestedTierFromBody = null;
                if (requestedModel) {
                    if (requestedModel.includes('flash')) requestedTierFromBody = 'cheap';
                    else if (requestedModel.includes('pro')) requestedTierFromBody = 'premium';
                    else if (requestedModel === 'auto') requestedTierFromBody = 'auto'; // allow explicit 'auto' model
                }

                // Default to auto if no specific tier inferred
                if (!requestedTierFromBody && !requestedModel) {
                    requestedTierFromBody = 'auto';
                }

                let requestedTier = determineRequestedTier({ tier: requestedTierFromBody }, userPolicy);
                let routingReason = 'explicit';

                // Resolve auto tier
                if (requestedTier === 'auto') {
                    const autoResult = resolveAutoTier(messages);
                    requestedTier = autoResult.tier;
                    routingReason = autoResult.reason;
                } else if (requestedTierFromBody) {
                    routingReason = 'explicit';
                } else {
                    routingReason = 'default';
                }

                // Validate and downgrade
                const validationResult = validateAndDowngrade(requestedTier, userPolicy);
                if (validationResult.tierUsed === null) {
                    return reply.code(403).send({
                        error: {
                            message: `Tier '${requestedTier}' is not allowed for user ${userId}`,
                            type: 'invalid_request_error',
                            param: 'model',
                            code: 'tier_not_allowed'
                        }
                    });
                }

                let tierUsed = validationResult.tierUsed;
                if (validationResult.routingReason) {
                    routingReason = validationResult.routingReason;
                }

                // Check limits
                const promptChars = messages.map(m => m.content || '').join('').length;
                const estimatedPromptTokens = estimatePromptTokens(promptChars);

                const limitCheck = await checkLimits(
                    userId,
                    tierUsed,
                    estimatedPromptTokens,
                    day,
                    month,
                    userPolicy,
                    systemPolicy
                );

                if (!limitCheck.allowed) {
                    // Log limited
                    const latencyMs = Date.now() - startTime;
                    await RequestLog.create({
                        ts: new Date(),
                        day, month, requestId, userId,
                        tierRequested: requestedTierFromBody || 'default',
                        tierUsed, routingReason,
                        status: 'limited',
                        latencyMs, promptChars,
                        promptTokens: 0, completionTokens: 0, totalTokens: 0,
                        estimatedTokens: true,
                        model: config.gemini.models[tierUsed],
                        errorMessage: limitCheck.error.message,
                    });

                    return reply.code(429).send({
                        error: {
                            message: limitCheck.error.message,
                            type: 'rate_limit_error',
                            param: null,
                            code: 'rate_limit_exceeded'
                        }
                    });
                }

                // Reserve request
                await reserveRequest(userId, tierUsed, day, month);

                // Call Provider
                let providerResult;
                let providerError = null;
                const usedModel = config.gemini.models[tierUsed];

                try {
                    providerResult = await callGemini(tierUsed, messages, usedModel);
                } catch (error) {
                    providerError = error;
                    // Fallback logic could go here similar to chat.js
                }

                if (providerError) {
                    // Log error
                    const latencyMs = Date.now() - startTime;
                    await RequestLog.create({
                        ts: new Date(),
                        day, month, requestId, userId,
                        tierRequested: requestedTierFromBody || 'default',
                        tierUsed, routingReason,
                        status: 'error',
                        latencyMs, promptChars,
                        promptTokens: 0, completionTokens: 0, totalTokens: 0,
                        estimatedTokens: true,
                        model: usedModel,
                        errorMessage: providerError.message,
                    });

                    return reply.code(providerError.statusCode || 500).send({
                        error: {
                            message: providerError.message,
                            type: 'api_error',
                            param: null,
                            code: 'provider_error'
                        }
                    });
                }

                // Update tokens
                await updateTokens(userId, tierUsed, day, month, providerResult.usage);

                // Check if streaming is requested
                const isStreaming = request.body.stream === true;

                // Log success
                const latencyMs = Date.now() - startTime;
                await RequestLog.create({
                    ts: new Date(),
                    day, month, requestId, userId,
                    tierRequested: requestedTierFromBody || 'default',
                    tierUsed, routingReason,
                    status: 'ok',
                    latencyMs, promptChars,
                    promptTokens: providerResult.usage.promptTokens,
                    completionTokens: providerResult.usage.completionTokens,
                    totalTokens: providerResult.usage.totalTokens,
                    estimatedTokens: providerResult.usage.estimated,
                    model: usedModel,
                    errorMessage: null,
                });

                if (isStreaming) {
                    reply.raw.writeHead(200, {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                        'Access-Control-Allow-Origin': '*',
                    });

                    // Chunk 1: Content
                    const chunk1 = {
                        id: `chatcmpl-${requestId}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: usedModel,
                        system_fingerprint: routingReason,
                        choices: [
                            {
                                index: 0,
                                delta: { role: 'assistant', content: providerResult.output },
                                finish_reason: null,
                            },
                        ],
                    };
                    reply.raw.write(`data: ${JSON.stringify(chunk1)}\n\n`);

                    // Chunk 2: Usage & Finish Reason
                    const chunk2 = {
                        id: `chatcmpl-${requestId}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: usedModel,
                        choices: [
                            {
                                index: 0,
                                delta: {},
                                finish_reason: 'stop',
                            },
                        ],
                        usage: {
                            prompt_tokens: providerResult.usage.promptTokens,
                            completion_tokens: providerResult.usage.completionTokens,
                            total_tokens: providerResult.usage.totalTokens,
                        },
                    };
                    reply.raw.write(`data: ${JSON.stringify(chunk2)}\n\n`);
                    reply.raw.write('data: [DONE]\n\n');
                    reply.raw.end();
                    return;
                }

                // Format response as OpenAI (Non-streaming)
                return reply.send({
                    id: `chatcmpl-${requestId}`,
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: usedModel, // The actual model used
                    system_fingerprint: routingReason, // Using fingerprint to pass back routing info!
                    choices: [
                        {
                            index: 0,
                            message: {
                                role: 'assistant',
                                content: providerResult.output,
                            },
                            finish_reason: 'stop',
                        },
                    ],
                    usage: {
                        prompt_tokens: providerResult.usage.promptTokens,
                        completion_tokens: providerResult.usage.completionTokens,
                        total_tokens: providerResult.usage.totalTokens,
                    },
                });

            } catch (error) {
                request.log.error(error);
                return reply.code(500).send({
                    error: {
                        message: error.message,
                        type: 'server_error',
                        param: null,
                        code: 'internal_error'
                    }
                });
            }
        },
    });
}
