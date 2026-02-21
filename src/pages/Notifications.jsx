import { useState } from 'react';
import { Mail, MessageSquare, Monitor, Bell } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { notifications } from '../data/mockData';
import './Notifications.css';

const filters = ['All', 'Email', 'SMS', 'System'];

const typeIcons = {
    Email: Mail,
    SMS: MessageSquare,
    System: Monitor,
};

export default function Notifications() {
    const [activeFilter, setActiveFilter] = useState('All');

    const filtered = notifications.filter(
        (n) => activeFilter === 'All' || n.type === activeFilter
    );

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date('2026-02-21T10:00:00');
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="notifications-page">
            <div className="page-header">
                <div className="notifications-page__header-row">
                    <div>
                        <h1>Notifications</h1>
                        <p>Real-time alerts from Kafka event pipeline</p>
                    </div>
                    <div className="notifications-page__unread-badge">
                        <Bell size={16} />
                        {unreadCount} unread
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="notifications-page__filters animate-fade-in-up">
                {filters.map((f) => (
                    <button
                        key={f}
                        className={`notifications-page__filter ${activeFilter === f ? 'notifications-page__filter--active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f !== 'All' && (() => {
                            const Icon = typeIcons[f];
                            return <Icon size={14} />;
                        })()}
                        {f}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="notifications-page__timeline">
                {filtered.map((notif, i) => {
                    const Icon = typeIcons[notif.type];
                    return (
                        <div
                            key={notif.id}
                            className={`notifications-page__item glass-card animate-fade-in-up ${!notif.read ? 'notifications-page__item--unread' : ''}`}
                            style={{ animationDelay: `${0.05 * (i + 1)}s` }}
                        >
                            <div className={`notifications-page__icon notifications-page__icon--${notif.type.toLowerCase()}`}>
                                <Icon size={18} />
                            </div>
                            <div className="notifications-page__content">
                                <div className="notifications-page__top-row">
                                    <h4 className="notifications-page__title">{notif.title}</h4>
                                    <div className="notifications-page__meta">
                                        <StatusBadge status={notif.type} size="sm" />
                                        <span className="notifications-page__time">{formatTime(notif.timestamp)}</span>
                                    </div>
                                </div>
                                <p className="notifications-page__message">{notif.message}</p>
                                {notif.orderId && (
                                    <span className="notifications-page__order-link">{notif.orderId}</span>
                                )}
                            </div>
                            {!notif.read && <div className="notifications-page__unread-dot" />}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="notifications-page__empty glass-card">
                    <Bell size={40} />
                    <p>No notifications found</p>
                </div>
            )}
        </div>
    );
}
