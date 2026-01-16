'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editPolicy, setEditPolicy] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, systemRes] = await Promise.all([
                fetch('/api/gateway/users', { cache: 'no-store' }),
                fetch('/api/gateway/system', { cache: 'no-store' }),
            ]);

            const users = await usersRes.json();
            const system = await systemRes.json();

            setData({ users: users.users, system });
            setEditPolicy(system.systemPolicy);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePolicy = async () => {
        try {
            const res = await fetch('/api/gateway/system', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editPolicy),
            });

            if (!res.ok) throw new Error('Failed to update policy');

            await fetchData();
            setIsEditing(false);
            toast.success('Global limits updated successfully');
        } catch (error) {
            console.error('Error updating system policy:', error);
            toast.error('Failed to update global limits');
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Refresh Data
                    </button>
                </div>

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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Global Limits & Configuration</h2>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-4 py-2 rounded text-white ${isEditing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isEditing ? 'Cancel Editing' : 'Edit Limits'}
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded border mb-4">
                            <div>
                                <h3 className="font-semibold mb-3 text-blue-800">Daily Token Limits</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium">Cheap Tier</label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalDailyTokenLimit.cheap}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalDailyTokenLimit: { ...editPolicy.globalDailyTokenLimit, cheap: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Premium Tier</label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalDailyTokenLimit.premium}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalDailyTokenLimit: { ...editPolicy.globalDailyTokenLimit, premium: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3 text-green-800">Monthly Token Limits</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium">Cheap Tier</label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalMonthlyTokenLimit.cheap}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalMonthlyTokenLimit: { ...editPolicy.globalMonthlyTokenLimit, cheap: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Premium Tier</label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalMonthlyTokenLimit.premium}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalMonthlyTokenLimit: { ...editPolicy.globalMonthlyTokenLimit, premium: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3 text-gray-800">Thresholds (%)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">Warning</label>
                                        <input
                                            type="number"
                                            value={editPolicy.warningThresholdPct}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, warningThresholdPct: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Critical</label>
                                        <input
                                            type="number"
                                            value={editPolicy.criticalThresholdPct}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, criticalThresholdPct: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end">
                                <button
                                    onClick={handleSavePolicy}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
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
                    )}
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
