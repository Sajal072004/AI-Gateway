'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, systemRes] = await Promise.all([
                fetch('/api/gateway/users'),
                fetch('/api/gateway/system'),
            ]);

            const users = await usersRes.json();
            const system = await systemRes.json();

            setData({ users: users.users, system });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Nav />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Nav />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-600">Error loading data</div>
                </div>
            </div>
        );
    }

    const { users, system } = data;
    const globalUsage = system.globalUsage;
    const systemPolicy = system.systemPolicy;

    // Calculate totals
    const todayTotal = {
        cheap: globalUsage.day.cheap.totalTokens,
        premium: globalUsage.day.premium.totalTokens,
        requests: globalUsage.day.cheap.requests + globalUsage.day.premium.requests,
    };

    const monthTotal = {
        cheap: globalUsage.month.cheap.totalTokens,
        premium: globalUsage.month.premium.totalTokens,
        requests: globalUsage.month.cheap.requests + globalUsage.month.premium.requests,
    };

    const premiumShareToday = todayTotal.cheap + todayTotal.premium > 0
        ? ((todayTotal.premium / (todayTotal.cheap + todayTotal.premium)) * 100).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Today Total Tokens"
                        value={(todayTotal.cheap + todayTotal.premium).toLocaleString()}
                        subtitle={`Cheap: ${todayTotal.cheap.toLocaleString()} | Premium: ${todayTotal.premium.toLocaleString()}`}
                    />
                    <StatCard
                        title="Month Total Tokens"
                        value={(monthTotal.cheap + monthTotal.premium).toLocaleString()}
                        subtitle={`Cheap: ${monthTotal.cheap.toLocaleString()} | Premium: ${monthTotal.premium.toLocaleString()}`}
                    />
                    <StatCard
                        title="Premium Share (Today)"
                        value={`${premiumShareToday}%`}
                        subtitle="Of total tokens"
                    />
                    <StatCard
                        title="Total Requests (Today)"
                        value={todayTotal.requests.toLocaleString()}
                        subtitle={`Month: ${monthTotal.requests.toLocaleString()}`}
                    />
                </div>

                {/* Global Limits */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Global Limits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Daily - Cheap Tier</h3>
                            <ProgressBar
                                current={globalUsage.day.cheap.totalTokens}
                                limit={systemPolicy.globalDailyTokenLimit.cheap}
                                warningPct={systemPolicy.warningThresholdPct}
                                criticalPct={systemPolicy.criticalThresholdPct}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Daily - Premium Tier</h3>
                            <ProgressBar
                                current={globalUsage.day.premium.totalTokens}
                                limit={systemPolicy.globalDailyTokenLimit.premium}
                                warningPct={systemPolicy.warningThresholdPct}
                                criticalPct={systemPolicy.criticalThresholdPct}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Monthly - Cheap Tier</h3>
                            <ProgressBar
                                current={globalUsage.month.cheap.totalTokens}
                                limit={systemPolicy.globalMonthlyTokenLimit.cheap}
                                warningPct={systemPolicy.warningThresholdPct}
                                criticalPct={systemPolicy.criticalThresholdPct}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Monthly - Premium Tier</h3>
                            <ProgressBar
                                current={globalUsage.month.premium.totalTokens}
                                limit={systemPolicy.globalMonthlyTokenLimit.premium}
                                warningPct={systemPolicy.warningThresholdPct}
                                criticalPct={systemPolicy.criticalThresholdPct}
                            />
                        </div>
                    </div>
                </div>

                {/* Users Overview */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Users Overview</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Today (Cheap)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Today (Premium)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Month (Cheap)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Month (Premium)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.policy.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                                            {user.policy.userId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                {user.usage.day.cheap.totalTokens.toLocaleString()} tokens
                                                <span className={`ml-2 px-2 py-1 text-xs rounded ${user.status.day.cheap === 'critical' ? 'bg-red-100 text-red-800' :
                                                        user.status.day.cheap === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.status.day.cheap.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                {user.usage.day.premium.totalTokens.toLocaleString()} tokens
                                                <span className={`ml-2 px-2 py-1 text-xs rounded ${user.status.day.premium === 'critical' ? 'bg-red-100 text-red-800' :
                                                        user.status.day.premium === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.status.day.premium.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                {user.usage.month.cheap.totalTokens.toLocaleString()} tokens
                                                <span className={`ml-2 px-2 py-1 text-xs rounded ${user.status.month.cheap === 'critical' ? 'bg-red-100 text-red-800' :
                                                        user.status.month.cheap === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.status.month.cheap.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                {user.usage.month.premium.totalTokens.toLocaleString()} tokens
                                                <span className={`ml-2 px-2 py-1 text-xs rounded ${user.status.month.premium === 'critical' ? 'bg-red-100 text-red-800' :
                                                        user.status.month.premium === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.status.month.premium.toUpperCase()}
                                                </span>
                                            </div>
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
