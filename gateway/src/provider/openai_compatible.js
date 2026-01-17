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
            // Raw Vertex AI Prediction format
            // Qwen usually expects OpenAI-like messages inside 'instances' or 'inputs' depending on the serving container
            // Standard vLLM on Vertex: { instances: [ { prompt: ... } ] } or { messages: ... } if adapted?
            // Let's assume the standard Vertex 'instances' format but with OpenAI messages inside if supported, 
            // OR we fallback to formatting a prompt.
            // MOST Vertex one-click deploys for LLMs wrap vLLM which exposes /v1. 
            // BUT if the user has the :predict URL, it's the raw Google wrapper.
            // Let's try standard Vertex format:
            body = {
                instances: [
                    {
                        messages: messages, // Try passing messages directly, many containers support this
                        // If not, we might need: prompt: messages[messages.length-1].content 
                    }
                ],
                parameters: {
                    max_tokens: 2048,
                    temperature: 0.7
                }
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
                output = typeof pred === 'string' ? pred : (pred.content || pred.output || JSON.stringify(pred));
                // Try to find usage
                // Sometimes in metadata?
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
