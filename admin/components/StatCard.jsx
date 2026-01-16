export default function StatCard({ title, value, subtitle, status }) {
    const statusColors = {
        ok: 'bg-green-100 text-green-800 border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        critical: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusColor = status ? statusColors[status] : 'bg-white';

    return (
        <div className={`rounded-lg border-2 p-6 ${statusColor}`}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className="text-3xl font-bold mb-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
    );
}
