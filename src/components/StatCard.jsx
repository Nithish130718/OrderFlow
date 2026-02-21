import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, change, color = 'blue', delay = 0 }) {
    const isPositive = change >= 0;

    return (
        <div
            className={`stat-card glass-card animate-fade-in-up`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="stat-card__header">
                <div className={`stat-card__icon stat-card__icon--${color}`}>
                    <Icon size={20} />
                </div>
                <div className={`stat-card__change ${isPositive ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(change)}%
                </div>
            </div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label">{label}</div>
        </div>
    );
}
