import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../env.js';

const geminiClients = {
    cheap: new GoogleGenerativeAI(config.gemini.keys.cheap),
    premium: new GoogleGenerativeAI(config.gemini.keys.premium),
};

/**
 * Call Gemini API with the specified tier
 * @param {string} tier - 'cheap' or 'premium'
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model name to use
 * @returns {Promise<{output: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number, estimated: boolean}}>}
 */
export async function callGemini(tier, messages, model) {
    const client = geminiClients[tier];
    const geminiModel = client.getGenerativeModel({ model });

    // Convert messages to Gemini format
    // Gemini expects a single prompt or a chat history
    // For simplicity, we'll concatenate messages into a single prompt
    const prompt = messages
        .map(msg => {
            if (msg.role === 'system') return `System: ${msg.content}`;
            if (msg.role === 'user') return `User: ${msg.content}`;
            if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
            return msg.content;
        })
        .join('\n\n');

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = result.response;
        const output = response.text();

        // Extract token usage from response
        let usage;
        if (response.usageMetadata) {
            usage = {
                promptTokens: response.usageMetadata.promptTokenCount || 0,
                completionTokens: response.usageMetadata.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata.totalTokenCount || 0,
                estimated: false,
            };
        } else {
            // Fallback estimation: chars / 4
            const promptChars = prompt.length;
            const outputChars = output.length;
            const estimatedPromptTokens = Math.max(1, Math.floor(promptChars / 4));
            const estimatedCompletionTokens = Math.max(1, Math.floor(outputChars / 4));
            usage = {
                promptTokens: estimatedPromptTokens,
                completionTokens: estimatedCompletionTokens,
                totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                estimated: true,
            };
        }

        return { output, usage };
    } catch (error) {
        // Re-throw with structured error
        const errorMessage = error.message || 'Unknown Gemini API error';
        const statusCode = error.status || 500;

        const structuredError = new Error(errorMessage);
        structuredError.statusCode = statusCode;
        structuredError.tier = tier;
        structuredError.isProviderError = true;

        throw structuredError;
    }
}

/**
 * Estimate prompt tokens from character count
 * @param {number} chars - Character count
 * @returns {number} Estimated token count
 */
export function estimatePromptTokens(chars) {
    return Math.max(1, Math.floor(chars / 4));
}
