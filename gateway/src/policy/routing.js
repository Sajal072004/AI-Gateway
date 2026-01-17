import { config } from '../env.js';

/**
 * Determine the requested tier from request body or user policy default
 */
export function determineRequestedTier(body, userPolicy) {
    return body.tier || userPolicy.defaultTier;
}

/**
 * Resolve 'auto' tier to 'cheap' or 'premium' based on heuristics
 */
export function resolveAutoTier(messages) {
    // Concatenate all user messages
    const userMessages = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

    const promptChars = userMessages.length;
    const promptLower = userMessages.toLowerCase();

    // Check if chars exceed threshold
    if (promptChars > config.routing.autoPremiumIfCharsOver) {
        return { tier: 'premium', reason: 'auto_chars' };
    }

    // Check if any keyword matches
    for (const keyword of config.routing.autoPremiumIfContains) {
        if (promptLower.includes(keyword)) {
            return { tier: 'premium', reason: 'auto_keyword' };
        }
    }

    // Default to cheap
    return { tier: 'cheap', reason: 'auto_default' };
}

/**
 * Validate tier is allowed for user, downgrade if necessary
 */
export function validateAndDowngrade(tier, userPolicy) {
    // Allow self-hosted/qwen tier if premium is allowed (treat as premium feature)
    if ((tier === 'qwen' || tier === 'self-hosted') && userPolicy.allowedTiers.includes('premium')) {
        return { tierUsed: tier, routingReason: null };
    }

    if (userPolicy.allowedTiers.includes(tier)) {
        return { tierUsed: tier, routingReason: null };
    }

    // Tier not allowed, try to downgrade to cheap
    if (userPolicy.allowedTiers.includes('cheap')) {
        return { tierUsed: 'cheap', routingReason: 'downgrade_not_allowed' };
    }

    // Cannot downgrade, reject
    return { tierUsed: null, routingReason: 'tier_not_allowed' };
}
