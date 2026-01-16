'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';

export default function ExportsPage() {
    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState('usage_daily');
    const [format, setFormat] = useState('csv');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: exportType,
                format,
            });

            if (day) params.append('day', day);
            if (month) params.append('month', month);

            const res = await fetch(`/api/gateway/export?${params.toString()}`);

            if (format === 'csv') {
                const text = await res.text();
                const blob = new Blob([text], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${exportType}_${Date.now()}.csv`;
                a.click();
            } else {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${exportType}_${Date.now()}.json`;
                a.click();
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Export failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Export Data</h1>

                <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Export Type</label>
                            <select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="usage_daily">Daily Usage</option>
                                <option value="usage_monthly">Monthly Usage</option>
                                <option value="logs">Request Logs</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>

                        {exportType === 'usage_daily' || exportType === 'logs' ? (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Day (YYYY-MM-DD) - Leave empty for today
                                </label>
                                <input
                                    type="date"
                                    value={day}
                                    onChange={(e) => setDay(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        ) : null}

                        {exportType === 'usage_monthly' || exportType === 'logs' ? (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Month (YYYY-MM) - Leave empty for current month
                                </label>
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        ) : null}

                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                        >
                            {loading ? 'Exporting...' : 'Export Data'}
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-md">
                        <h3 className="font-semibold mb-2">Export Information</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• <strong>Daily Usage:</strong> Token and request counts per user/tier for a specific day</li>
                            <li>• <strong>Monthly Usage:</strong> Token and request counts per user/tier for a specific month</li>
                            <li>• <strong>Request Logs:</strong> Detailed logs of all requests (limited to 10,000 records)</li>
                            <li>• <strong>CSV:</strong> Spreadsheet-compatible format</li>
                            <li>• <strong>JSON:</strong> Machine-readable format for further processing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
