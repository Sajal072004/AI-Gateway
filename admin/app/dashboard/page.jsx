'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
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
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Nav />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div className="animate-pulse">Loading dashboard...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Nav />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', color: 'var(--error)' }}>Error loading data</div>
                </div>
            </div>
        );
    }

    const { users, system } = data;
    const globalUsage = system.globalUsage;
    const systemPolicy = system.systemPolicy;

    // Calculate totals including qwen
    const todayTotal = {
        cheap: globalUsage.day.cheap?.totalTokens || 0,
        premium: globalUsage.day.premium?.totalTokens || 0,
        qwen: globalUsage.day.qwen?.totalTokens || 0,
        requests: (globalUsage.day.cheap?.requests || 0) + (globalUsage.day.premium?.requests || 0) + (globalUsage.day.qwen?.requests || 0),
    };

    const monthTotal = {
        cheap: globalUsage.month.cheap?.totalTokens || 0,
        premium: globalUsage.month.premium?.totalTokens || 0,
        qwen: globalUsage.month.qwen?.totalTokens || 0,
        requests: (globalUsage.month.cheap?.requests || 0) + (globalUsage.month.premium?.requests || 0) + (globalUsage.month.qwen?.requests || 0),
    };

    const totalTokensToday = todayTotal.cheap + todayTotal.premium + todayTotal.qwen;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Nav />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Monitor your AI Gateway performance and usage
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }} className="animate-fade-in">
                    {/* Total Tokens Today */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                    Today Total
                                </p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                                    {totalTokensToday.toLocaleString()}
                                </h3>
                            </div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <span className="badge badge-cheap" style={{ marginRight: '0.5rem' }}>{todayTotal.cheap.toLocaleString()}</span>
                            <span className="badge badge-premium" style={{ marginRight: '0.5rem' }}>{todayTotal.premium.toLocaleString()}</span>
                            <span className="badge badge-qwen">{todayTotal.qwen.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Month Total */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                    Month Total
                                </p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                                    {(monthTotal.cheap + monthTotal.premium + monthTotal.qwen).toLocaleString()}
                                </h3>
                            </div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <span className="badge badge-cheap" style={{ marginRight: '0.5rem' }}>{monthTotal.cheap.toLocaleString()}</span>
                            <span className="badge badge-premium" style={{ marginRight: '0.5rem' }}>{monthTotal.premium.toLocaleString()}</span>
                            <span className="badge badge-qwen">{monthTotal.qwen.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Total Requests */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                    Requests Today
                                </p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                                    {todayTotal.requests.toLocaleString()}
                                </h3>
                            </div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Month: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{monthTotal.requests.toLocaleString()}</span>
                        </p>
                    </div>

                    {/* Active Users */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                                    Active Users
                                </p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                                    {users.length}
                                </h3>
                            </div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Total registered users
                        </p>
                    </div>
                </div>

                {/* Global Limits Section */}
                <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                Global Limits & Configuration
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                System-wide rate limits and thresholds
                            </p>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={isEditing ? 'btn btn-danger' : 'btn btn-primary'}
                        >
                            {isEditing ? 'Cancel' : 'Edit Limits'}
                        </button>
                    </div>

                    {isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {/* Cheap Tier */}
                            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                <h3 style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge badge-cheap">Cheap</span> Tier Limits
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Daily Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalDailyTokenLimit.cheap}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalDailyTokenLimit: { ...editPolicy.globalDailyTokenLimit, cheap: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Monthly Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalMonthlyTokenLimit.cheap}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalMonthlyTokenLimit: { ...editPolicy.globalMonthlyTokenLimit, cheap: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Premium Tier */}
                            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                <h3 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge badge-premium">Premium</span> Tier Limits
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Daily Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalDailyTokenLimit.premium}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalDailyTokenLimit: { ...editPolicy.globalDailyTokenLimit, premium: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Monthly Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalMonthlyTokenLimit.premium}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalMonthlyTokenLimit: { ...editPolicy.globalMonthlyTokenLimit, premium: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Qwen Tier */}
                            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                <h3 style={{ color: 'var(--warning)', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge badge-qwen">Qwen</span> Tier Limits
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Daily Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalDailyTokenLimit.qwen || 0}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalDailyTokenLimit: { ...editPolicy.globalDailyTokenLimit, qwen: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Monthly Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.globalMonthlyTokenLimit.qwen || 0}
                                            onChange={(e) => setEditPolicy({
                                                ...editPolicy,
                                                globalMonthlyTokenLimit: { ...editPolicy.globalMonthlyTokenLimit, qwen: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thresholds */}
                            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1rem' }}>
                                    Alert Thresholds
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Warning (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.warningThresholdPct}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, warningThresholdPct: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            Critical (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={editPolicy.criticalThresholdPct}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, criticalThresholdPct: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button
                                    onClick={handleSavePolicy}
                                    className="btn btn-primary"
                                    style={{ padding: '1rem 2rem', fontSize: '1rem' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Usage Progress Bars */}
                            {['cheap', 'premium', 'qwen'].map(tier => (
                                <div key={tier} style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span className={`badge badge-${tier}`}>{tier}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Daily</span>
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Tokens</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                                {(globalUsage.day[tier]?.totalTokens || 0).toLocaleString()} / {(systemPolicy.globalDailyTokenLimit[tier] || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min(100, ((globalUsage.day[tier]?.totalTokens || 0) / (systemPolicy.globalDailyTokenLimit[tier] || 1)) * 100)}%`,
                                                height: '100%',
                                                background: tier === 'cheap' ? 'var(--gradient-success)' : tier === 'premium' ? 'var(--gradient-primary)' : 'var(--gradient-warning)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        Users Overview
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Today (Cheap)</th>
                                    <th>Today (Premium)</th>
                                    <th>Today (Qwen)</th>
                                    <th>Month Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.policy.userId}>
                                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                            {user.policy.userId}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{(user.usage.day.cheap?.totalTokens || 0).toLocaleString()}</span>
                                                <span className={`badge badge-${user.status.day.cheap === 'critical' ? 'error' : user.status.day.cheap === 'warning' ? 'qwen' : 'success'}`}>
                                                    {user.status.day.cheap}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{(user.usage.day.premium?.totalTokens || 0).toLocaleString()}</span>
                                                <span className={`badge badge-${user.status.day.premium === 'critical' ? 'error' : user.status.day.premium === 'warning' ? 'qwen' : 'success'}`}>
                                                    {user.status.day.premium}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{(user.usage.day.qwen?.totalTokens || 0).toLocaleString()}</span>
                                                <span className={`badge badge-${user.status.day.qwen === 'critical' ? 'error' : user.status.day.qwen === 'warning' ? 'qwen' : 'success'}`}>
                                                    {user.status.day.qwen || 'ok'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>
                                            {((user.usage.month.cheap?.totalTokens || 0) + (user.usage.month.premium?.totalTokens || 0) + (user.usage.month.qwen?.totalTokens || 0)).toLocaleString()}
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
