'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Nav() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const navItems = [
        {
            href: '/dashboard', label: 'Dashboard', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            href: '/users', label: 'Users', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        {
            href: '/analytics', label: 'Analytics', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
            )
        },
    ];

    return (
        <nav style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                        <h1 style={{
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            AI Gateway
                        </h1>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        transition: 'all var(--transition-base)',
                                        background: pathname === item.href ? 'var(--bg-elevated)' : 'transparent',
                                        color: pathname === item.href ? 'var(--primary)' : 'var(--text-secondary)',
                                        border: pathname === item.href ? '1px solid var(--border-default)' : '1px solid transparent',
                                        textDecoration: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (pathname !== item.href) {
                                            e.currentTarget.style.background = 'var(--bg-surface-hover)';
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (pathname !== item.href) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
