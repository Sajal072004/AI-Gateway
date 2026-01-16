/**
 * Calculate limit status (ok/warning/critical) for each period and scope
 */
export function calculateLimitStatus(usageSnapshot, userPolicy, systemPolicy, tier) {
    const thresholds = {
        warningPct: systemPolicy.warningThresholdPct,
        criticalPct: systemPolicy.criticalThresholdPct,
    };

    const userDayStatus = getStatus(
        usageSnapshot.user.day.totalTokens,
        userPolicy.dailyTokenLimit[tier],
        thresholds
    );

    const userMonthStatus = getStatus(
        usageSnapshot.user.month.totalTokens,
        userPolicy.monthlyTokenLimit[tier],
        thresholds
    );

    const globalDayStatus = getStatus(
        usageSnapshot.global.day.totalTokens,
        systemPolicy.globalDailyTokenLimit[tier],
        thresholds
    );

    const globalMonthStatus = getStatus(
        usageSnapshot.global.month.totalTokens,
        systemPolicy.globalMonthlyTokenLimit[tier],
        thresholds
    );

    return {
        userDay: userDayStatus,
        userMonth: userMonthStatus,
        globalDay: globalDayStatus,
        globalMonth: globalMonthStatus,
    };
}

/**
 * Get status for a single usage/limit pair
 */
function getStatus(usage, limit, thresholds) {
    if (limit === 0) {
        return 'ok'; // No limit set
    }

    const pct = (usage / limit) * 100;

    if (pct >= thresholds.criticalPct) {
        return 'critical';
    }

    if (pct >= thresholds.warningPct) {
        return 'warning';
    }

    return 'ok';
}
