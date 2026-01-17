import { UsageRollup } from '../db/models/UsageRollup.js';

/**
 * Check if request would exceed limits (pre-check before provider call)
 */
export async function checkLimits(userId, tier, estimatedPromptTokens, day, month, userPolicy, systemPolicy) {
    // Map self-hosted 'qwen' tier to 'premium' quota/bucket
    const quotaTier = (tier === 'qwen' || tier === 'self-hosted') ? 'premium' : tier;

    // Fetch current usage rollups
    const userDay = await getRollup('user', 'day', day, userId, quotaTier);
    const userMonth = await getRollup('user', 'month', month, userId, quotaTier);
    const globalDay = await getRollup('global', 'day', day, null, quotaTier);
    const globalMonth = await getRollup('global', 'month', month, null, quotaTier);

    // Get limits using mapped quotaTier
    const userDailyTokenLimit = userPolicy.dailyTokenLimit[quotaTier];
    const userMonthlyTokenLimit = userPolicy.monthlyTokenLimit[quotaTier];
    const userDailyRequestLimit = userPolicy.dailyRequestLimit[quotaTier];
    const userMonthlyRequestLimit = userPolicy.monthlyRequestLimit[quotaTier];

    const globalDailyTokenLimit = systemPolicy.globalDailyTokenLimit[quotaTier];
    const globalMonthlyTokenLimit = systemPolicy.globalMonthlyTokenLimit[quotaTier];
    const globalDailyRequestLimit = systemPolicy.globalDailyRequestLimit[quotaTier];
    const globalMonthlyRequestLimit = systemPolicy.globalMonthlyRequestLimit[quotaTier];

    // Check user daily request limit
    if (userDailyRequestLimit > 0 && userDay.requests + 1 > userDailyRequestLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'user',
                periodType: 'day',
                tier,
                limitType: 'requests',
                message: `User daily request limit exceeded for ${tier} tier`,
                limits: { dailyRequestLimit: userDailyRequestLimit },
                usage: { requests: userDay.requests },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check user monthly request limit
    if (userMonthlyRequestLimit > 0 && userMonth.requests + 1 > userMonthlyRequestLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'user',
                periodType: 'month',
                tier,
                limitType: 'requests',
                message: `User monthly request limit exceeded for ${tier} tier`,
                limits: { monthlyRequestLimit: userMonthlyRequestLimit },
                usage: { requests: userMonth.requests },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check user daily token limit (estimated)
    if (userDailyTokenLimit > 0 && userDay.totalTokens + estimatedPromptTokens > userDailyTokenLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'user',
                periodType: 'day',
                tier,
                limitType: 'tokens',
                message: `User daily token limit exceeded for ${tier} tier`,
                limits: { dailyTokenLimit: userDailyTokenLimit },
                usage: { totalTokens: userDay.totalTokens },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check user monthly token limit (estimated)
    if (userMonthlyTokenLimit > 0 && userMonth.totalTokens + estimatedPromptTokens > userMonthlyTokenLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'user',
                periodType: 'month',
                tier,
                limitType: 'tokens',
                message: `User monthly token limit exceeded for ${tier} tier`,
                limits: { monthlyTokenLimit: userMonthlyTokenLimit },
                usage: { totalTokens: userMonth.totalTokens },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check global daily request limit
    if (globalDailyRequestLimit > 0 && globalDay.requests + 1 > globalDailyRequestLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'global',
                periodType: 'day',
                tier,
                limitType: 'requests',
                message: `Global daily request limit exceeded for ${tier} tier`,
                limits: { globalDailyRequestLimit },
                usage: { requests: globalDay.requests },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check global monthly request limit
    if (globalMonthlyRequestLimit > 0 && globalMonth.requests + 1 > globalMonthlyRequestLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'global',
                periodType: 'month',
                tier,
                limitType: 'requests',
                message: `Global monthly request limit exceeded for ${tier} tier`,
                limits: { globalMonthlyRequestLimit },
                usage: { requests: globalMonth.requests },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check global daily token limit (estimated)
    if (globalDailyTokenLimit > 0 && globalDay.totalTokens + estimatedPromptTokens > globalDailyTokenLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'global',
                periodType: 'day',
                tier,
                limitType: 'tokens',
                message: `Global daily token limit exceeded for ${tier} tier`,
                limits: { globalDailyTokenLimit },
                usage: { totalTokens: globalDay.totalTokens },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    // Check global monthly token limit (estimated)
    if (globalMonthlyTokenLimit > 0 && globalMonth.totalTokens + estimatedPromptTokens > globalMonthlyTokenLimit) {
        return {
            allowed: false,
            error: {
                error: 'limit_exceeded',
                scope: 'global',
                periodType: 'month',
                tier,
                limitType: 'tokens',
                message: `Global monthly token limit exceeded for ${tier} tier`,
                limits: { globalMonthlyTokenLimit },
                usage: { totalTokens: globalMonth.totalTokens },
                thresholds: {
                    warningPct: systemPolicy.warningThresholdPct,
                    criticalPct: systemPolicy.criticalThresholdPct,
                },
            },
        };
    }

    return { allowed: true };
}

/**
 * Reserve request counters (atomic increment)
 */
export async function reserveRequest(userId, tier, day, month) {
    // Map self-hosted 'qwen' tier to 'premium' quota/bucket
    const quotaTier = (tier === 'qwen' || tier === 'self-hosted') ? 'premium' : tier;

    // Update user day
    await UsageRollup.findOneAndUpdate(
        { periodType: 'day', period: day, scope: 'user', userId, tier: quotaTier },
        { $inc: { requests: 1 } },
        { upsert: true, new: true }
    );

    // Update user month
    await UsageRollup.findOneAndUpdate(
        { periodType: 'month', period: month, scope: 'user', userId, tier: quotaTier },
        { $inc: { requests: 1 } },
        { upsert: true, new: true }
    );

    // Update global day
    await UsageRollup.findOneAndUpdate(
        { periodType: 'day', period: day, scope: 'global', userId: null, tier: quotaTier },
        { $inc: { requests: 1 } },
        { upsert: true, new: true }
    );

    // Update global month
    await UsageRollup.findOneAndUpdate(
        { periodType: 'month', period: month, scope: 'global', userId: null, tier: quotaTier },
        { $inc: { requests: 1 } },
        { upsert: true, new: true }
    );
}

/**
 * Update token counters (atomic increment)
 */
export async function updateTokens(userId, tier, day, month, usage) {
    // Map self-hosted 'qwen' tier to 'premium' quota/bucket
    const quotaTier = (tier === 'qwen' || tier === 'self-hosted') ? 'premium' : tier;

    const tokenUpdate = {
        $inc: {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
        },
    };

    // Update user day
    await UsageRollup.findOneAndUpdate(
        { periodType: 'day', period: day, scope: 'user', userId, tier: quotaTier },
        tokenUpdate,
        { upsert: true, new: true }
    );

    // Update user month
    await UsageRollup.findOneAndUpdate(
        { periodType: 'month', period: month, scope: 'user', userId, tier: quotaTier },
        tokenUpdate,
        { upsert: true, new: true }
    );

    // Update global day
    await UsageRollup.findOneAndUpdate(
        { periodType: 'day', period: day, scope: 'global', userId: null, tier: quotaTier },
        tokenUpdate,
        { upsert: true, new: true }
    );

    // Update global month
    await UsageRollup.findOneAndUpdate(
        { periodType: 'month', period: month, scope: 'global', userId: null, tier: quotaTier },
        tokenUpdate,
        { upsert: true, new: true }
    );
}

/**
 * Get current rollups for response
 */
export async function getRollups(userId, tier, day, month) {
    const userDay = await getRollup('user', 'day', day, userId, tier);
    const userMonth = await getRollup('user', 'month', month, userId, tier);
    const globalDay = await getRollup('global', 'day', day, null, tier);
    const globalMonth = await getRollup('global', 'month', month, null, tier);

    return {
        user: {
            day: userDay,
            month: userMonth,
        },
        global: {
            day: globalDay,
            month: globalMonth,
        },
    };
}

/**
 * Helper to get a single rollup (returns zero values if not exists)
 */
async function getRollup(scope, periodType, period, userId, tier) {
    const rollup = await UsageRollup.findOne({
        periodType,
        period,
        scope,
        userId,
        tier,
    });

    if (!rollup) {
        return {
            requests: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
        };
    }

    return {
        requests: rollup.requests,
        promptTokens: rollup.promptTokens,
        completionTokens: rollup.completionTokens,
        totalTokens: rollup.totalTokens,
    };
}
