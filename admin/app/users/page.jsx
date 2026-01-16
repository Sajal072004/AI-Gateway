'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import ProgressBar from '@/components/ProgressBar';
import { toast } from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({
        userId: '',
        allowedTiers: ['cheap'],
        defaultTier: 'cheap',
        dailyTokenLimit: { cheap: 100000, premium: 0 },
        monthlyTokenLimit: { cheap: 3000000, premium: 0 },
    });
    const [copiedToken, setCopiedToken] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/gateway/users', { cache: 'no-store' });
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

    const handleAddUser = async () => {
        try {
            const res = await fetch('/api/gateway/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.success(
                (t) => (
                    <div>
                        <p className="font-bold">User created!</p>
                        <p className="text-sm mt-1 mb-2">Token: <code className="bg-gray-100 px-1">{data.userPolicy.token}</code></p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(data.userPolicy.token);
                                toast.success('Copied!');
                            }}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                        >
                            Copy Token
                        </button>
                    </div>
                ),
                { duration: 10000 }
            );

            setShowAddUser(false);
            setNewUser({
                userId: '',
                allowedTiers: ['cheap'],
                defaultTier: 'cheap',
                dailyTokenLimit: { cheap: 100000, premium: 0 },
                monthlyTokenLimit: { cheap: 3000000, premium: 0 },
            });
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Error creating user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm(`Are you sure you want to delete user "${userId}"? This cannot be undone.`)) {
            return;
        }
        try {
            await fetch(`/api/gateway/users?userId=${userId}&deleteUsageData=true`, {
                method: 'DELETE',
            });
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleRegenerateToken = async (userId) => {
        if (!confirm(`Regenerate token for "${userId}"? The old token will be invalidated immediately.`)) {
            return;
        }
        try {
            const res = await fetch(`/api/gateway/users/${userId}/regenerate-token`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.success(
                (t) => (
                    <div>
                        <p className="font-bold">New Token Generated!</p>
                        <p className="text-sm mt-1 mb-2 break-all font-mono bg-gray-50 p-1 rounded border">{data.userPolicy.token}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(data.userPolicy.token);
                                toast.success('Copied!');
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded w-full hover:bg-blue-200"
                        >
                            Click to Copy
                        </button>
                    </div>
                ),
                { duration: 10000, style: { minWidth: '350px' } }
            );

            fetchUsers();
        } catch (error) {
            console.error('Error regenerating token:', error);
            toast.error(error.message || 'Error regenerating token');
        }
    };

    const copyToken = (token, userId) => {
        navigator.clipboard.writeText(token);
        setCopiedToken(userId);
        toast.success('Token copied to clipboard!');
        setTimeout(() => setCopiedToken(null), 2000);
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <button
                        onClick={() => setShowAddUser(!showAddUser)}
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                    >
                        {showAddUser ? 'Cancel' : '+ Add User'}
                    </button>
                </div>

                {showAddUser && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Create New User</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">User ID</label>
                                <input
                                    type="text"
                                    value={newUser.userId}
                                    onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="e.g., developer_john"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Allowed Tiers</label>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newUser.allowedTiers.includes('cheap')}
                                            onChange={(e) => {
                                                const tiers = e.target.checked
                                                    ? [...newUser.allowedTiers, 'cheap']
                                                    : newUser.allowedTiers.filter(t => t !== 'cheap');
                                                setNewUser({ ...newUser, allowedTiers: tiers });
                                            }}
                                            className="mr-2"
                                        />
                                        Cheap
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newUser.allowedTiers.includes('premium')}
                                            onChange={(e) => {
                                                const tiers = e.target.checked
                                                    ? [...newUser.allowedTiers, 'premium']
                                                    : newUser.allowedTiers.filter(t => t !== 'premium');
                                                setNewUser({ ...newUser, allowedTiers: tiers });
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
                                    value={newUser.defaultTier}
                                    onChange={(e) => setNewUser({ ...newUser, defaultTier: e.target.value })}
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
                                        value={newUser.dailyTokenLimit.cheap}
                                        onChange={(e) => setNewUser({
                                            ...newUser,
                                            dailyTokenLimit: { ...newUser.dailyTokenLimit, cheap: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Daily Token Limit (Premium)</label>
                                    <input
                                        type="number"
                                        value={newUser.dailyTokenLimit.premium}
                                        onChange={(e) => setNewUser({
                                            ...newUser,
                                            dailyTokenLimit: { ...newUser.dailyTokenLimit, premium: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddUser}
                                disabled={!newUser.userId}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                Create User
                            </button>
                        </div>
                    </div>
                )}

                {users.map((user) => (
                    <div key={user.policy.userId} className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{user.policy.userId}</h2>
                            <div className="space-x-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRegenerateToken(user.policy.userId)}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                                >
                                    🔄 Regenerate Token
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user.policy.userId)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Token Display */}
                        <div className="mb-4 p-3 bg-gray-50 rounded border">
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-600">Token:</span>
                                    <code className="ml-2 text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                                        {user.policy.token}
                                    </code>
                                </div>
                                <button
                                    onClick={() => copyToken(user.policy.token, user.policy.userId)}
                                    className="ml-4 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                    {copiedToken === user.policy.userId ? '✓ Copied!' : '📋 Copy'}
                                </button>
                            </div>
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
