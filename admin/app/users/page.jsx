'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
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
        dailyTokenLimit: { cheap: 100000, premium: 0, qwen: 0 },
        monthlyTokenLimit: { cheap: 3000000, premium: 0, qwen: 0 },
        dailyRequestLimit: { cheap: 0, premium: 0, qwen: 0 },
        monthlyRequestLimit: { cheap: 0, premium: 0, qwen: 0 },
    });

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
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser({
            userId: user.policy.userId,
            ...user.policy,
            dailyTokenLimit: { cheap: 0, premium: 0, qwen: 0, ...user.policy.dailyTokenLimit },
            monthlyTokenLimit: { cheap: 0, premium: 0, qwen: 0, ...user.policy.monthlyTokenLimit },
            dailyRequestLimit: { cheap: 0, premium: 0, qwen: 0, ...user.policy.dailyRequestLimit },
            monthlyRequestLimit: { cheap: 0, premium: 0, qwen: 0, ...user.policy.monthlyRequestLimit },
        });
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/gateway/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser),
            });

            if (!res.ok) throw new Error('Failed to update user');

            setEditingUser(null);
            await fetchUsers();
            toast.success('User updated successfully');
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user');
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
                        <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>User created!</p>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Token: <code style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{data.userPolicy.token}</code>
                        </p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(data.userPolicy.token);
                                toast.success('Token copied!');
                            }}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
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
                dailyTokenLimit: { cheap: 100000, premium: 0, qwen: 0 },
                monthlyTokenLimit: { cheap: 3000000, premium: 0, qwen: 0 },
                dailyRequestLimit: { cheap: 0, premium: 0, qwen: 0 },
                monthlyRequestLimit: { cheap: 0, premium: 0, qwen: 0 },
            });
            await fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Failed to create user');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm(`Delete user ${userId}? This cannot be undone.`)) return;

        try {
            const res = await fetch('/api/gateway/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error('Failed to delete user');

            await fetchUsers();
            toast.success('User deleted');
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const copyToken = (token) => {
        navigator.clipboard.writeText(token);
        toast.success('Token copied to clipboard');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Nav />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="animate-pulse">
                        Loading users...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Nav />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Users
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Manage user access and limits
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="btn btn-primary"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add User
                    </button>
                </div>

                {/* Add User Modal */}
                {showAddUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                        <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                                Add New User
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.userId}
                                        onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                                        placeholder="e.g., user@example.com"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Allowed Tiers
                                    </label>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {['cheap', 'premium', 'qwen'].map(tier => (
                                            <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newUser.allowedTiers.includes(tier)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewUser({ ...newUser, allowedTiers: [...newUser.allowedTiers, tier] });
                                                        } else {
                                                            setNewUser({ ...newUser, allowedTiers: newUser.allowedTiers.filter(t => t !== tier) });
                                                        }
                                                    }}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span className={`badge badge-${tier}`}>{tier}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Default Tier
                                    </label>
                                    <select
                                        value={newUser.defaultTier}
                                        onChange={(e) => setNewUser({ ...newUser, defaultTier: e.target.value })}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="cheap">Cheap</option>
                                        <option value="premium">Premium</option>
                                        <option value="qwen">Qwen</option>
                                    </select>
                                </div>

                                {/* Limits for each tier */}
                                {['cheap', 'premium', 'qwen'].map(tier => (
                                    <div key={tier} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                        <h3 className={`badge badge-${tier}`} style={{ marginBottom: '1rem' }}>{tier} Limits</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Daily Tokens</label>
                                                <input
                                                    type="number"
                                                    value={newUser.dailyTokenLimit[tier]}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        dailyTokenLimit: { ...newUser.dailyTokenLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Monthly Tokens</label>
                                                <input
                                                    type="number"
                                                    value={newUser.monthlyTokenLimit[tier]}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        monthlyTokenLimit: { ...newUser.monthlyTokenLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setShowAddUser(false)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddUser}
                                        className="btn btn-primary"
                                        disabled={!newUser.userId}
                                    >
                                        Create User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                        <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                                Edit User: {editingUser.userId}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Allowed Tiers
                                    </label>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {['cheap', 'premium', 'qwen'].map(tier => (
                                            <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingUser.allowedTiers.includes(tier)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setEditingUser({ ...editingUser, allowedTiers: [...editingUser.allowedTiers, tier] });
                                                        } else {
                                                            setEditingUser({ ...editingUser, allowedTiers: editingUser.allowedTiers.filter(t => t !== tier) });
                                                        }
                                                    }}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span className={`badge badge-${tier}`}>{tier}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Default Tier
                                    </label>
                                    <select
                                        value={editingUser.defaultTier}
                                        onChange={(e) => setEditingUser({ ...editingUser, defaultTier: e.target.value })}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="cheap">Cheap</option>
                                        <option value="premium">Premium</option>
                                        <option value="qwen">Qwen</option>
                                    </select>
                                </div>

                                {/* Limits for each tier */}
                                {['cheap', 'premium', 'qwen'].map(tier => (
                                    <div key={tier} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                        <h3 className={`badge badge-${tier}`} style={{ marginBottom: '1rem' }}>{tier} Limits</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Daily Tokens</label>
                                                <input
                                                    type="number"
                                                    value={editingUser.dailyTokenLimit[tier]}
                                                    onChange={(e) => setEditingUser({
                                                        ...editingUser,
                                                        dailyTokenLimit: { ...editingUser.dailyTokenLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Monthly Tokens</label>
                                                <input
                                                    type="number"
                                                    value={editingUser.monthlyTokenLimit[tier]}
                                                    onChange={(e) => setEditingUser({
                                                        ...editingUser,
                                                        monthlyTokenLimit: { ...editingUser.monthlyTokenLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Daily Requests</label>
                                                <input
                                                    type="number"
                                                    value={editingUser.dailyRequestLimit[tier]}
                                                    onChange={(e) => setEditingUser({
                                                        ...editingUser,
                                                        dailyRequestLimit: { ...editingUser.dailyRequestLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Monthly Requests</label>
                                                <input
                                                    type="number"
                                                    value={editingUser.monthlyRequestLimit[tier]}
                                                    onChange={(e) => setEditingUser({
                                                        ...editingUser,
                                                        monthlyRequestLimit: { ...editingUser.monthlyRequestLimit, [tier]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-primary"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }} className="animate-fade-in">
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Tiers</th>
                                    <th>Default</th>
                                    <th>Token</th>
                                    <th>Daily Usage</th>
                                    <th>Month Usage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.policy.userId}>
                                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                            {user.policy.userId}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                {user.policy.allowedTiers.map(tier => (
                                                    <span key={tier} className={`badge badge-${tier}`}>{tier}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${user.policy.defaultTier === 'auto' ? 'success' : user.policy.defaultTier}`}>
                                                {user.policy.defaultTier}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => copyToken(user.policy.token)}
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                            >
                                                Copy
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                {((user.usage.day.cheap?.totalTokens || 0) + (user.usage.day.premium?.totalTokens || 0) + (user.usage.day.qwen?.totalTokens || 0)).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                {((user.usage.month.cheap?.totalTokens || 0) + (user.usage.month.premium?.totalTokens || 0) + (user.usage.month.qwen?.totalTokens || 0)).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.policy.userId)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                                                >
                                                    Delete
                                                </button>
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
