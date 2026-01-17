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
    const [selectedStatus, setSelectedStatus] = useState('all');

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

    // Filter logs
    const filteredLogs = logs.filter(log => {
        if (selectedUser !== 'all' && log.userId !== selectedUser) return false;
        if (selectedTier !== 'all' && log.tierUsed !== selectedTier) return false;
        if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;

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

    // Calculate stats
    const stats = {
        total: filteredLogs.length,
        success: filteredLogs.filter(l => l.status === 'ok').length,
        errors: filteredLogs.filter(l => l.status === 'error').length,
        totalTokens: filteredLogs.reduce((sum, l) => sum + (l.usage?.totalTokens || 0), 0),
        byTier: {
            cheap: filteredLogs.filter(l => l.tierUsed === 'cheap').length,
            premium: filteredLogs.filter(l => l.tierUsed === 'premium').length,
            qwen: filteredLogs.filter(l => l.tierUsed === 'qwen').length,
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Nav />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="animate-pulse">
                        Loading analytics...
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
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Analytics
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Request logs and usage insights
                    </p>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="animate-fade-in">
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Requests</p>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Success</p>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{stats.success}</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Errors</p>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--error)' }}>{stats.errors}</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Tokens</p>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.totalTokens.toLocaleString()}</p>
                    </div>
                </div>

                {/* Tier Distribution */}
                <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        Requests by Tier
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-cheap">Cheap</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{stats.byTier.cheap}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-premium">Premium</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{stats.byTier.premium}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-qwen">Qwen</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{stats.byTier.qwen}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        Filters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Date Range
                            </label>
                            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">This Month</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                User
                            </label>
                            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                <option value="all">All Users</option>
                                {users.map(user => (
                                    <option key={user.policy.userId} value={user.policy.userId}>
                                        {user.policy.userId}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Tier
                            </label>
                            <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
                                <option value="all">All Tiers</option>
                                <option value="cheap">Cheap</option>
                                <option value="premium">Premium</option>
                                <option value="qwen">Qwen</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Status
                            </label>
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="ok">Success</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="glass-card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            Request Logs ({filteredLogs.length})
                        </h3>
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                        <table>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Tier</th>
                                    <th>Status</th>
                                    <th>Tokens</th>
                                    <th>Model</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                                            No logs found for the selected filters
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {new Date(log.ts).toLocaleString()}
                                            </td>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {log.userId}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${log.tierUsed}`}>
                                                    {log.tierUsed}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${log.status === 'ok' ? 'success' : 'error'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                                {log.usage?.totalTokens?.toLocaleString() || 0}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {log.model || 'N/A'}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {log.durationMs ? `${log.durationMs}ms` : 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
