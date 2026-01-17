import { authenticateAdmin } from '../auth/adminAuth.js';
import { SystemPolicy } from '../db/models/SystemPolicy.js';
import { UserPolicy } from '../db/models/UserPolicy.js';
import { UsageRollup } from '../db/models/UsageRollup.js';
import { RequestLog } from '../db/models/RequestLog.js';
import { jsonToCsv } from '../utils/csv.js';
import { getCurrentDay, getCurrentMonth } from '../utils/time.js';

export async function registerAdminRoutes(fastify) {
    /**
     * GET /admin/api/system
     * Get system policy and global usage
     */
    fastify.get('/admin/api/system', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const systemPolicy = await SystemPolicy.findOne({ key: 'system' });
            if (!systemPolicy) {
                return reply.code(404).send({ error: 'System policy not found' });
            }

            const day = getCurrentDay();
            const month = getCurrentMonth();

            // Get global usage for all tiers
            const globalUsage = {
                day: {
                    cheap: await getGlobalUsage('day', day, 'cheap'),
                    premium: await getGlobalUsage('day', day, 'premium'),
                    qwen: await getGlobalUsage('day', day, 'qwen'),
                },
                month: {
                    cheap: await getGlobalUsage('month', month, 'cheap'),
                    premium: await getGlobalUsage('month', month, 'premium'),
                    qwen: await getGlobalUsage('month', month, 'qwen'),
                },
            };

            return reply.send({
                systemPolicy,
                globalUsage,
            });
        },
    });

    /**
     * PUT /admin/api/system
     * Update system policy
     */
    fastify.put('/admin/api/system', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const updates = request.body;

            const systemPolicy = await SystemPolicy.findOneAndUpdate(
                { key: 'system' },
                { ...updates, updatedAt: new Date() },
                { new: true }
            );

            return reply.send({ systemPolicy });
        },
    });

    /**
     * GET /admin/api/users
     * Get all user policies with usage
     */
    fastify.get('/admin/api/users', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const userPolicies = await UserPolicy.find({});
            const systemPolicy = await SystemPolicy.findOne({ key: 'system' });

            const day = getCurrentDay();
            const month = getCurrentMonth();

            const usersWithUsage = await Promise.all(
                userPolicies.map(async (policy) => {
                    const usage = {
                        day: {
                            cheap: await getUserUsage('day', day, policy.userId, 'cheap'),
                            premium: await getUserUsage('day', day, policy.userId, 'premium'),
                            qwen: await getUserUsage('day', day, policy.userId, 'qwen'),
                        },
                        month: {
                            cheap: await getUserUsage('month', month, policy.userId, 'cheap'),
                            premium: await getUserUsage('month', month, policy.userId, 'premium'),
                            qwen: await getUserUsage('month', month, policy.userId, 'qwen'),
                        },
                    };

                    // Calculate status flags
                    const status = {
                        day: {
                            cheap: calculateStatus(usage.day.cheap.totalTokens, policy.dailyTokenLimit.cheap, systemPolicy),
                            premium: calculateStatus(usage.day.premium.totalTokens, policy.dailyTokenLimit.premium, systemPolicy),
                            qwen: calculateStatus(usage.day.qwen.totalTokens, policy.dailyTokenLimit.qwen, systemPolicy),
                        },
                        month: {
                            cheap: calculateStatus(usage.month.cheap.totalTokens, policy.monthlyTokenLimit.cheap, systemPolicy),
                            premium: calculateStatus(usage.month.premium.totalTokens, policy.monthlyTokenLimit.premium, systemPolicy),
                            qwen: calculateStatus(usage.month.qwen.totalTokens, policy.monthlyTokenLimit.qwen, systemPolicy),
                        },
                    };

                    return {
                        policy: policy.toObject(),
                        usage,
                        status,
                    };
                })
            );

            return reply.send({ users: usersWithUsage });
        },
    });

    /**
     * PUT /admin/api/users/:userId
     * Update user policy
     */
    fastify.put('/admin/api/users/:userId', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { userId } = request.params;
            const updates = request.body;

            const userPolicy = await UserPolicy.findOneAndUpdate(
                { userId },
                { ...updates, updatedAt: new Date() },
                { new: true }
            );

            if (!userPolicy) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send({ userPolicy });
        },
    });

    /**
     * POST /admin/api/users
     * Create a new user
     */
    fastify.post('/admin/api/users', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { generateUserToken } = await import('../utils/tokenGenerator.js');
            const userData = request.body;

            // Check if userId already exists
            const existing = await UserPolicy.findOne({ userId: userData.userId });
            if (existing) {
                return reply.code(400).send({ error: 'User ID already exists' });
            }

            // Generate token if not provided
            const token = userData.token || generateUserToken();

            // Create user with defaults
            const newUser = await UserPolicy.create({
                userId: userData.userId,
                token,
                allowedTiers: userData.allowedTiers || ['cheap'],
                defaultTier: userData.defaultTier || 'cheap',
                dailyTokenLimit: userData.dailyTokenLimit || { cheap: 100000, premium: 0 },
                monthlyTokenLimit: userData.monthlyTokenLimit || { cheap: 3000000, premium: 0 },
                dailyRequestLimit: userData.dailyRequestLimit || { cheap: 100, premium: 0 },
                monthlyRequestLimit: userData.monthlyRequestLimit || { cheap: 3000, premium: 0 },
            });

            return reply.send({
                userPolicy: newUser.toObject(),
                message: 'User created successfully'
            });
        },
    });

    /**
     * DELETE /admin/api/users/:userId
     * Delete a user
     */
    fastify.delete('/admin/api/users/:userId', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { userId } = request.params;
            const { deleteUsageData } = request.query;

            const userPolicy = await UserPolicy.findOneAndDelete({ userId });

            if (!userPolicy) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Optionally delete usage data
            if (deleteUsageData === 'true') {
                await UsageRollup.deleteMany({ userId, scope: 'user' });
                await RequestLog.deleteMany({ userId });
            }

            return reply.send({
                message: 'User deleted successfully',
                deletedUsageData: deleteUsageData === 'true'
            });
        },
    });

    /**
     * POST /admin/api/users/:userId/regenerate-token
     * Regenerate user's authentication token
     */
    fastify.post('/admin/api/users/:userId/regenerate-token', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { userId } = request.params;
            const { generateUserToken } = await import('../utils/tokenGenerator.js');

            // Generate new token
            const newToken = generateUserToken();

            // Update user with new token
            const userPolicy = await UserPolicy.findOneAndUpdate(
                { userId },
                { token: newToken, updatedAt: new Date() },
                { new: true }
            );

            if (!userPolicy) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send({
                userPolicy: userPolicy.toObject(),
                message: 'Token regenerated successfully',
                oldTokenInvalidated: true
            });
        },
    });

    /**
     * GET /admin/api/usage
     * Get aggregated usage
     */
    fastify.get('/admin/api/usage', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { day, month } = request.query;

            const filters = {};
            if (day) {
                filters.periodType = 'day';
                filters.period = day;
            } else if (month) {
                filters.periodType = 'month';
                filters.period = month;
            } else {
                // Default to current day
                filters.periodType = 'day';
                filters.period = getCurrentDay();
            }

            const rollups = await UsageRollup.find(filters);

            return reply.send({ usage: rollups });
        },
    });

    /**
     * GET /admin/api/logs
     * Get request logs with filters
     */
    fastify.get('/admin/api/logs', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { limit = 100, userId, tierUsed, status, day, month } = request.query;

            const filters = {};
            if (userId) filters.userId = userId;
            if (tierUsed) filters.tierUsed = tierUsed;
            if (status) filters.status = status;
            if (day) filters.day = day;
            if (month) filters.month = month;

            const logs = await RequestLog.find(filters)
                .sort({ ts: -1 })
                .limit(parseInt(limit, 10));

            return reply.send({ logs });
        },
    });

    /**
     * POST /admin/api/reset
     * Reset usage rollups
     */
    fastify.post('/admin/api/reset', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { scope, periodType, period, userId } = request.body;

            const deleteFilter = {};

            if (periodType) deleteFilter.periodType = periodType;
            if (period) deleteFilter.period = period;

            if (scope === 'user') {
                deleteFilter.scope = 'user';
                if (userId) deleteFilter.userId = userId;
            } else if (scope === 'global') {
                deleteFilter.scope = 'global';
            }
            // scope === 'all' means no scope filter

            const result = await UsageRollup.deleteMany(deleteFilter);

            return reply.send({
                message: 'Usage reset successfully',
                deletedCount: result.deletedCount,
            });
        },
    });

    /**
     * GET /admin/api/export
     * Export data as JSON or CSV
     */
    fastify.get('/admin/api/export', {
        preHandler: authenticateAdmin,
        handler: async (request, reply) => {
            const { type, format = 'json', day, month } = request.query;

            let data = [];
            let filename = 'export';

            if (type === 'usage_daily') {
                const targetDay = day || getCurrentDay();
                data = await UsageRollup.find({ periodType: 'day', period: targetDay }).lean();
                filename = `usage_daily_${targetDay}`;
            } else if (type === 'usage_monthly') {
                const targetMonth = month || getCurrentMonth();
                data = await UsageRollup.find({ periodType: 'month', period: targetMonth }).lean();
                filename = `usage_monthly_${targetMonth}`;
            } else if (type === 'logs') {
                const filters = {};
                if (day) filters.day = day;
                if (month) filters.month = month;
                data = await RequestLog.find(filters).sort({ ts: -1 }).limit(10000).lean();
                filename = `logs_${day || month || 'all'}`;
            } else {
                return reply.code(400).send({ error: 'Invalid export type' });
            }

            if (format === 'csv') {
                const csv = jsonToCsv(data);
                reply.header('Content-Type', 'text/csv');
                reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
                return reply.send(csv);
            } else {
                reply.header('Content-Type', 'application/json');
                reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
                return reply.send(data);
            }
        },
    });
}

// Helper functions
async function getGlobalUsage(periodType, period, tier) {
    const rollup = await UsageRollup.findOne({
        periodType,
        period,
        scope: 'global',
        userId: null,
        tier,
    });

    if (!rollup) {
        return { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    return {
        requests: rollup.requests,
        promptTokens: rollup.promptTokens,
        completionTokens: rollup.completionTokens,
        totalTokens: rollup.totalTokens,
    };
}

async function getUserUsage(periodType, period, userId, tier) {
    const rollup = await UsageRollup.findOne({
        periodType,
        period,
        scope: 'user',
        userId,
        tier,
    });

    if (!rollup) {
        return { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    return {
        requests: rollup.requests,
        promptTokens: rollup.promptTokens,
        completionTokens: rollup.completionTokens,
        totalTokens: rollup.totalTokens,
    };
}

function calculateStatus(usage, limit, systemPolicy) {
    if (limit === 0) return 'ok';

    const pct = (usage / limit) * 100;

    if (pct >= systemPolicy.criticalThresholdPct) return 'critical';
    if (pct >= systemPolicy.warningThresholdPct) return 'warning';
    return 'ok';
}
