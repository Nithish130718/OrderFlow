import './StatusBadge.css';

const colorMap = {
    Placed: 'blue',
    Processing: 'amber',
    Shipped: 'purple',
    Delivered: 'green',
    Cancelled: 'red',
    Healthy: 'green',
    Degraded: 'amber',
    Down: 'red',
    Connected: 'green',
    Running: 'green',
    Email: 'blue',
    SMS: 'purple',
    System: 'amber',
};

export default function StatusBadge({ status, size = 'md' }) {
    const color = colorMap[status] || 'blue';

    return (
        <span className={`status-badge status-badge--${color} status-badge--${size}`}>
            <span className="status-badge__dot" />
            {status}
        </span>
    );
}
