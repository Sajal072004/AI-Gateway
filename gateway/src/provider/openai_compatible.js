import { config } from '../env.js';

/**
 * Call a generic OpenAI-compatible API (e.g., self-hosted Qwen/Llama)
 * @param {Array} messages - Array of message objects
 * @param {string} model - Model name (optional, defaults to config)
 * @returns {Promise<{output: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number}}>}
 */
export async function callOpenAICompatible(messages, model) {
    if (!config.selfHosted.url) {
        throw new Error('SELF_HOSTED_URL is not configured');
    }

    let endpoint = config.selfHosted.url;
    const isVertex = endpoint.includes('vertexai.goog') || endpoint.includes(':predict');

    // If not Vertex/predict, append standard OpenAI path
    if (!isVertex && !endpoint.includes('/chat/completions')) {
        endpoint = `${endpoint}/chat/completions`;
    }

    const targetModel = model || config.selfHosted.model;

    try {
        let body;

        if (isVertex) {
            // Raw Vertex AI Prediction format requires 'prompt' field for this container
            // We need to format messages into a single string (Qwen ChatML format)

            // Check if there's a system message, if not add one
            const hasSystem = messages.some(m => m.role === 'system');
            let messagesToFormat = [...messages];
            if (!hasSystem) {
                messagesToFormat.unshift({
                    role: 'system',
                    content: 'You are an intelligent agentic AI assistant. You are helpful, precise, and expert in coding tasks. Follow user instructions carefully.'
                });
            }

            const prompt = messagesToFormat.map(m => {
                let role = m.role;
                if (role === 'user') role = 'user';
                if (role === 'assistant') role = 'assistant';
                if (role === 'system') role = 'system';
                return `<|im_start|>${role}\n${m.content}<|im_end|>`;
            }).join('\n') + '\n<|im_start|>assistant\n';

            body = {
                instances: [
                    {
                        prompt: prompt,
                        max_tokens: 2048,
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 40
                    }
                ],
            };
        } else {
            // Standard OpenAI format
            body = {
                model: targetModel,
                messages: messages,
                max_tokens: 2048,
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.selfHosted.key || 'no-key-needed'}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`Self-hosted provider error: ${response.status} ${response.statusText}`);
            error.statusCode = response.status;
            error.details = errorText;
            throw error;
        }

        const data = await response.json();
        let output = '';
        let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimated: false };

        if (isVertex) {
            // Parse Vertex Response
            // Usually: { predictions: [ { content: "...", ... } ] }
            if (data.predictions && data.predictions.length > 0) {
                // prediction structure varies by container. 
                // Common: prediction or prediction.content or prediction.output
                const pred = data.predictions[0];
                let rawOutput = typeof pred === 'string' ? pred : (pred.content || pred.output || JSON.stringify(pred));

                // Fix for Qwen deployment which returns "Prompt: ... Output: ..." string
                if (rawOutput.includes('Output:\n')) {
                    const parts = rawOutput.split('Output:\n');
                    // Return the last part to handle cases where "Output:" might be in the prompt text itself (rare but possible)
                    // But usually, the structure is rigid. Let's take the part after the last "Output:\n"
                    if (parts.length > 1) {
                        output = parts[parts.length - 1];
                    } else {
                        output = rawOutput;
                    }
                } else {
                    output = rawOutput;
                }
            }
        } else {
            // Standard OpenAI
            output = data.choices[0]?.message?.content || '';
            usage = {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
                estimated: false,
            };
        }

        return { output, usage };
    } catch (error) {
        // Wrap error
        if (!error.statusCode) error.statusCode = 500;
        error.isProviderError = true;
        throw error;
    }
}
