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

    const endpoint = `${config.selfHosted.url}/chat/completions`;
    const targetModel = model || config.selfHosted.model;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.selfHosted.key || 'no-key-needed'}`,
            },
            body: JSON.stringify({
                model: targetModel,
                messages: messages,
                max_tokens: 2048, // Safe default
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`Self-hosted provider error: ${response.status} ${response.statusText}`);
            error.statusCode = response.status;
            error.details = errorText;
            throw error;
        }

        const data = await response.json();
        const output = data.choices[0]?.message?.content || '';
        const usage = {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
            estimated: false,
        };

        return { output, usage };
    } catch (error) {
        // Wrap error
        if (!error.statusCode) error.statusCode = 500;
        error.isProviderError = true;
        throw error;
    }
}
