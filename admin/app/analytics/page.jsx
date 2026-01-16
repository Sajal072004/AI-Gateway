'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function AnalyticsPage() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedTier, setSelectedTier] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, usersRes] = await Promise.all([
                fetch('/api/gateway/logs?limit=1000'),
                fetch('/api/gateway/users')
            ]);
            const logsData = await logsRes.json();
            const usersData = await usersRes.json();
            setLogs(logsData.logs || []);
            setUsers(usersData.users || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logs based on selections
    const filteredLogs = logs.filter(log => {
        if (selectedUser !== 'all' && log.userId !== selectedUser) return false;
        if (selectedTier !== 'all' && log.tierUsed !== selectedTier) return false;

        const logDate = new Date(log.ts);
        const now = new Date();

        if (dateRange === 'today') {
            return logDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return logDate >= weekAgo;
        } else if (dateRange === 'month') {
            return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    // Calculate statistics
    const stats = {
        totalRequests: filteredLogs.length,
        successfulRequests: filteredLogs.filter(l => l.status === 'success').length,
        failedRequests: filteredLogs.filter(l => l.status === 'error').length,
        totalTokens: filteredLogs.reduce((sum, l) => sum + (l.usage?.totalTokens || 0), 0),
        cheapRequests: filteredLogs.filter(l => l.tierUsed === 'cheap').length,
        premiumRequests: filteredLogs.filter(l => l.tierUsed === 'premium').length,
        avgLatency: filteredLogs.length > 0
            ? Math.round(filteredLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / filteredLogs.length)
            : 0,
    };

    // Per-user breakdown
    const userBreakdown = {};
    filteredLogs.forEach(log => {
        if (!userBreakdown[log.userId]) {
            userBreakdown[log.userId] = {
                requests: 0,
                tokens: 0,
                cheap: 0,
                premium: 0,
                errors: 0,
            };
        }
        userBreakdown[log.userId].requests++;
        userBreakdown[log.userId].tokens += log.usage?.totalTokens || 0;
        if (log.tierUsed === 'cheap') userBreakdown[log.userId].cheap++;
        if (log.tierUsed === 'premium') userBreakdown[log.userId].premium++;
        if (log.status === 'error') userBreakdown[log.userId].errors++;
    });

    // Hourly breakdown for today
    const hourlyData = Array(24).fill(0).map((_, hour) => {
        const count = filteredLogs.filter(log => {
            const logHour = new Date(log.ts).getHours();
            return logHour === hour;
        }).length;
        return { hour, count };
    });

    // Model breakdown
    const modelBreakdown = {};
    filteredLogs.forEach(log => {
        const model = log.model || 'unknown';
        if (!modelBreakdown[model]) {
            modelBreakdown[model] = { count: 0, tokens: 0 };
        }
        modelBreakdown[model].count++;
        modelBreakdown[model].tokens += log.usage?.totalTokens || 0;
    });

    // Routing reason breakdown
    const routingBreakdown = {};
    filteredLogs.forEach(log => {
        const reason = log.routingReason || 'unknown';
        if (!routingBreakdown[reason]) routingBreakdown[reason] = 0;
        routingBreakdown[reason]++;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Nav />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading analytics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">📊 Advanced Analytics</h1>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Filters</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">This Month</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">User</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="all">All Users</option>
                                {users.map(u => (
                                    <option key={u.policy.userId} value={u.policy.userId}>
                                        {u.policy.userId}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tier</label>
                            <select
                                value={selectedTier}
                                onChange={(e) => setSelectedTier(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="all">All Tiers</option>
                                <option value="cheap">Cheap</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600">Total Requests</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.totalRequests}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            ✓ {stats.successfulRequests} | ✗ {stats.failedRequests}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600">Total Tokens</div>
                        <div className="text-3xl font-bold text-green-600">
                            {stats.totalTokens.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Across all requests
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600">Tier Distribution</div>
                        <div className="text-lg font-bold">
                            <span className="text-blue-600">{stats.cheapRequests}</span> cheap |{' '}
                            <span className="text-purple-600">{stats.premiumRequests}</span> premium
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats.totalRequests > 0
                                ? `${Math.round((stats.premiumRequests / stats.totalRequests) * 100)}% premium`
                                : '0% premium'}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600">Avg Latency</div>
                        <div className="text-3xl font-bold text-orange-600">{stats.avgLatency}ms</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Response time
                        </div>
                    </div>
                </div>

                {/* Hourly Activity Chart */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">📈 Hourly Activity</h2>
                    <div className="flex items-end justify-between h-64 gap-1">
                        {hourlyData.map(({ hour, count }) => {
                            const maxCount = Math.max(...hourlyData.map(d => d.count), 1);
                            const height = (count / maxCount) * 100;
                            return (
                                <div key={hour} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                                        style={{ height: `${height}%` }}
                                        title={`${hour}:00 - ${count} requests`}
                                    />
                                    <div className="text-xs text-gray-600 mt-1">{hour}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Per-User Breakdown */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">👥 Per-User Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">User</th>
                                    <th className="text-right py-2 px-4">Requests</th>
                                    <th className="text-right py-2 px-4">Tokens</th>
                                    <th className="text-right py-2 px-4">Cheap</th>
                                    <th className="text-right py-2 px-4">Premium</th>
                                    <th className="text-right py-2 px-4">Errors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(userBreakdown)
                                    .sort((a, b) => b[1].requests - a[1].requests)
                                    .map(([userId, data]) => (
                                        <tr key={userId} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-4 font-medium">{userId}</td>
                                            <td className="py-2 px-4 text-right">{data.requests}</td>
                                            <td className="py-2 px-4 text-right">{data.tokens.toLocaleString()}</td>
                                            <td className="py-2 px-4 text-right text-blue-600">{data.cheap}</td>
                                            <td className="py-2 px-4 text-right text-purple-600">{data.premium}</td>
                                            <td className="py-2 px-4 text-right text-red-600">{data.errors}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Model Breakdown */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">🤖 Model Usage</h2>
                        <div className="space-y-3">
                            {Object.entries(modelBreakdown)
                                .sort((a, b) => b[1].count - a[1].count)
                                .map(([model, data]) => (
                                    <div key={model}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{model}</span>
                                            <span>{data.count} requests</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(data.count / stats.totalRequests) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {data.tokens.toLocaleString()} tokens
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">🎯 Routing Reasons</h2>
                        <div className="space-y-3">
                            {Object.entries(routingBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([reason, count]) => (
                                    <div key={reason}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium capitalize">{reason.replace(/_/g, ' ')}</span>
                                            <span>{count} requests</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(count / stats.totalRequests) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {Math.round((count / stats.totalRequests) * 100)}% of total
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Recent Requests */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">📝 Recent Requests</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2">Time</th>
                                    <th className="text-left py-2 px-2">User</th>
                                    <th className="text-left py-2 px-2">Tier</th>
                                    <th className="text-left py-2 px-2">Model</th>
                                    <th className="text-right py-2 px-2">Tokens</th>
                                    <th className="text-right py-2 px-2">Latency</th>
                                    <th className="text-left py-2 px-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.slice(0, 50).map((log) => (
                                    <tr key={log.requestId} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-2">
                                            {new Date(log.ts).toLocaleTimeString()}
                                        </td>
                                        <td className="py-2 px-2 font-medium">{log.userId}</td>
                                        <td className="py-2 px-2">
                                            <span className={`px-2 py-1 rounded text-xs ${log.tierUsed === 'cheap'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {log.tierUsed}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-xs">{log.model}</td>
                                        <td className="py-2 px-2 text-right">
                                            {log.usage?.totalTokens || 0}
                                        </td>
                                        <td className="py-2 px-2 text-right">{log.latencyMs}ms</td>
                                        <td className="py-2 px-2">
                                            <span className={`px-2 py-1 rounded text-xs ${log.status === 'success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
