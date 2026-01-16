import { authenticateUser } from '../auth/userAuth.js';
import { UserPolicy } from '../db/models/UserPolicy.js';
import { SystemPolicy } from '../db/models/SystemPolicy.js';
import { RequestLog } from '../db/models/RequestLog.js';
import { determineRequestedTier, resolveAutoTier, validateAndDowngrade } from '../policy/routing.js';
import { checkLimits, reserveRequest, updateTokens, getRollups } from '../policy/limits.js';
import { calculateLimitStatus } from '../policy/thresholds.js';
import { callGemini, estimatePromptTokens } from '../provider/gemini.js';
import { getCurrentDay, getCurrentMonth } from '../utils/time.js';
import { generateRequestId } from '../utils/requestId.js';
import { config } from '../env.js';

export async function registerChatRoutes(fastify) {
    /**
     * POST /v1/chat
     * Main user endpoint for AI requests
     */
    fastify.post('/v1/chat', {
        preHandler: authenticateUser,
        handler: async (request, reply) => {
            const startTime = Date.now();
            const requestId = generateRequestId();
            const userId = request.userId;
            const { messages, tier: requestedTierFromBody, meta } = request.body;

            // Validate messages
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return reply.code(400).send({
                    error: 'invalid_request',
                    message: 'messages array is required and must not be empty',
                });
            }

            const day = getCurrentDay();
            const month = getCurrentMonth();

            try {
                // Load policies
                const userPolicy = await UserPolicy.findOne({ userId });
                if (!userPolicy) {
                    return reply.code(404).send({
                        error: 'user_not_found',
                        message: `No policy found for user: ${userId}`,
                    });
                }

                const systemPolicy = await SystemPolicy.findOne({ key: 'system' });
                if (!systemPolicy) {
                    return reply.code(500).send({
                        error: 'system_error',
                        message: 'System policy not found',
                    });
                }

                // Determine requested tier
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

                // Validate and downgrade if necessary
                const validationResult = validateAndDowngrade(requestedTier, userPolicy);
                if (validationResult.tierUsed === null) {
                    return reply.code(403).send({
                        error: 'tier_not_allowed',
                        message: `Tier '${requestedTier}' is not allowed for user ${userId}`,
                        allowedTiers: userPolicy.allowedTiers,
                    });
                }

                let tierUsed = validationResult.tierUsed;
                if (validationResult.routingReason) {
                    routingReason = validationResult.routingReason;
                }

                // Calculate prompt chars and estimate tokens
                const promptChars = messages.map(m => m.content || '').join('').length;
                const estimatedPromptTokens = estimatePromptTokens(promptChars);

                // Check limits (pre-check)
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
                    // Log limited request
                    const latencyMs = Date.now() - startTime;
                    await RequestLog.create({
                        ts: new Date(),
                        day,
                        month,
                        requestId,
                        userId,
                        tierRequested: requestedTier,
                        tierUsed,
                        routingReason,
                        status: 'limited',
                        latencyMs,
                        promptChars,
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                        estimatedTokens: true,
                        model: config.gemini.models[tierUsed],
                        errorMessage: limitCheck.error.message,
                    });

                    return reply.code(429).send(limitCheck.error);
                }

                // Reserve request counters
                await reserveRequest(userId, tierUsed, day, month);

                // Call provider
                let providerResult;
                let providerError = null;
                const model = config.gemini.models[tierUsed];

                try {
                    providerResult = await callGemini(tierUsed, messages, model);
                } catch (error) {
                    providerError = error;

                    // Try fallback to cheap if premium failed
                    if (
                        tierUsed === 'premium' &&
                        config.routing.fallbackToCheapOnPremiumError &&
                        userPolicy.allowedTiers.includes('cheap') &&
                        (error.statusCode === 429 || error.statusCode >= 500)
                    ) {
                        try {
                            tierUsed = 'cheap';
                            routingReason = 'fallback';
                            const cheapModel = config.gemini.models.cheap;
                            providerResult = await callGemini('cheap', messages, cheapModel);
                            providerError = null;

                            // Reserve request for cheap tier as well
                            await reserveRequest(userId, 'cheap', day, month);
                        } catch (fallbackError) {
                            providerError = fallbackError;
                        }
                    }
                }

                if (providerError) {
                    // Log error
                    const latencyMs = Date.now() - startTime;
                    await RequestLog.create({
                        ts: new Date(),
                        day,
                        month,
                        requestId,
                        userId,
                        tierRequested: requestedTier,
                        tierUsed,
                        routingReason,
                        status: 'error',
                        latencyMs,
                        promptChars,
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                        estimatedTokens: true,
                        model,
                        errorMessage: providerError.message,
                    });

                    return reply.code(providerError.statusCode || 500).send({
                        error: 'provider_error',
                        message: providerError.message,
                        requestId,
                    });
                }

                // Update token counters
                await updateTokens(userId, tierUsed, day, month, providerResult.usage);

                // Get current rollups for response
                const usageSnapshot = await getRollups(userId, tierUsed, day, month);

                // Calculate limit status
                const limitStatus = calculateLimitStatus(usageSnapshot, userPolicy, systemPolicy, tierUsed);

                // Log successful request
                const latencyMs = Date.now() - startTime;
                await RequestLog.create({
                    ts: new Date(),
                    day,
                    month,
                    requestId,
                    userId,
                    tierRequested: requestedTier,
                    tierUsed,
                    routingReason,
                    status: 'ok',
                    latencyMs,
                    promptChars,
                    promptTokens: providerResult.usage.promptTokens,
                    completionTokens: providerResult.usage.completionTokens,
                    totalTokens: providerResult.usage.totalTokens,
                    estimatedTokens: providerResult.usage.estimated,
                    model,
                    errorMessage: null,
                });

                // Build response
                return reply.send({
                    requestId,
                    userId,
                    tierUsed,
                    model,
                    routingReason,
                    output: providerResult.output,
                    usage: providerResult.usage,
                    limitsSnapshot: {
                        user: {
                            dailyTokenLimit: userPolicy.dailyTokenLimit[tierUsed],
                            monthlyTokenLimit: userPolicy.monthlyTokenLimit[tierUsed],
                            dailyRequestLimit: userPolicy.dailyRequestLimit[tierUsed],
                            monthlyRequestLimit: userPolicy.monthlyRequestLimit[tierUsed],
                        },
                        global: {
                            dailyTokenLimit: systemPolicy.globalDailyTokenLimit[tierUsed],
                            monthlyTokenLimit: systemPolicy.globalMonthlyTokenLimit[tierUsed],
                            dailyRequestLimit: systemPolicy.globalDailyRequestLimit[tierUsed],
                            monthlyRequestLimit: systemPolicy.globalMonthlyRequestLimit[tierUsed],
                        },
                        thresholds: {
                            warningPct: systemPolicy.warningThresholdPct,
                            criticalPct: systemPolicy.criticalThresholdPct,
                        },
                    },
                    usageSnapshot,
                    limitStatus,
                    latencyMs,
                });
            } catch (error) {
                request.log.error(error);
                return reply.code(500).send({
                    error: 'internal_error',
                    message: error.message,
                    requestId,
                });
            }
        },
    });
}
