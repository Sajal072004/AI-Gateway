export default function ProgressBar({ current, limit, warningPct = 80, criticalPct = 95 }) {
    if (limit === 0) {
        return <div className="text-sm text-gray-500">No limit set</div>;
    }

    const percentage = Math.min((current / limit) * 100, 100);

    let barColor = 'bg-green-500';
    let status = 'OK';

    if (percentage >= criticalPct) {
        barColor = 'bg-red-500';
        status = 'CRITICAL';
    } else if (percentage >= warningPct) {
        barColor = 'bg-yellow-500';
        status = 'WARNING';
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                    {current.toLocaleString()} / {limit.toLocaleString()}
                </span>
                <span className={`font-medium ${status === 'CRITICAL' ? 'text-red-600' :
                        status === 'WARNING' ? 'text-yellow-600' :
                            'text-green-600'
                    }`}>
                    {percentage.toFixed(1)}% ({status})
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                    className={`${barColor} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
