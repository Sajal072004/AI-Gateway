'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import ProgressBar from '@/components/ProgressBar';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/gateway/users');
            const data = await res.json();
            setUsers(data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser({
            userId: user.policy.userId,
            ...user.policy,
        });
    };

    const handleSave = async () => {
        try {
            await fetch('/api/gateway/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser),
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
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

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">User Management</h1>

                {users.map((user) => (
                    <div key={user.policy.userId} className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{user.policy.userId}</h2>
                            <button
                                onClick={() => handleEdit(user)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Edit
                            </button>
                        </div>

                        {editingUser && editingUser.userId === user.policy.userId ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Allowed Tiers</label>
                                    <div className="space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editingUser.allowedTiers.includes('cheap')}
                                                onChange={(e) => {
                                                    const tiers = e.target.checked
                                                        ? [...editingUser.allowedTiers, 'cheap']
                                                        : editingUser.allowedTiers.filter(t => t !== 'cheap');
                                                    setEditingUser({ ...editingUser, allowedTiers: tiers });
                                                }}
                                                className="mr-2"
                                            />
                                            Cheap
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editingUser.allowedTiers.includes('premium')}
                                                onChange={(e) => {
                                                    const tiers = e.target.checked
                                                        ? [...editingUser.allowedTiers, 'premium']
                                                        : editingUser.allowedTiers.filter(t => t !== 'premium');
                                                    setEditingUser({ ...editingUser, allowedTiers: tiers });
                                                }}
                                                className="mr-2"
                                            />
                                            Premium
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Default Tier</label>
                                    <select
                                        value={editingUser.defaultTier}
                                        onChange={(e) => setEditingUser({ ...editingUser, defaultTier: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="cheap">Cheap</option>
                                        <option value="premium">Premium</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Daily Token Limit (Cheap)</label>
                                        <input
                                            type="number"
                                            value={editingUser.dailyTokenLimit.cheap}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                dailyTokenLimit: { ...editingUser.dailyTokenLimit, cheap: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Daily Token Limit (Premium)</label>
                                        <input
                                            type="number"
                                            value={editingUser.dailyTokenLimit.premium}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                dailyTokenLimit: { ...editingUser.dailyTokenLimit, premium: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Monthly Token Limit (Cheap)</label>
                                        <input
                                            type="number"
                                            value={editingUser.monthlyTokenLimit.cheap}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                monthlyTokenLimit: { ...editingUser.monthlyTokenLimit, cheap: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Monthly Token Limit (Premium)</label>
                                        <input
                                            type="number"
                                            value={editingUser.monthlyTokenLimit.premium}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                monthlyTokenLimit: { ...editingUser.monthlyTokenLimit, premium: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <span className="font-medium">Allowed Tiers:</span> {user.policy.allowedTiers.join(', ')}
                                    <span className="ml-4 font-medium">Default:</span> {user.policy.defaultTier}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Daily Cheap Tokens</h3>
                                        <ProgressBar
                                            current={user.usage.day.cheap.totalTokens}
                                            limit={user.policy.dailyTokenLimit.cheap}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Daily Premium Tokens</h3>
                                        <ProgressBar
                                            current={user.usage.day.premium.totalTokens}
                                            limit={user.policy.dailyTokenLimit.premium}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Monthly Cheap Tokens</h3>
                                        <ProgressBar
                                            current={user.usage.month.cheap.totalTokens}
                                            limit={user.policy.monthlyTokenLimit.cheap}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Monthly Premium Tokens</h3>
                                        <ProgressBar
                                            current={user.usage.month.premium.totalTokens}
                                            limit={user.policy.monthlyTokenLimit.premium}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
