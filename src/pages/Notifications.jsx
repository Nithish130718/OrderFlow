import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Mail, MessageSquare, Monitor } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAppContext } from '../context/useAppContext';
import './Notifications.css';

const filters = ['All', 'Email', 'SMS', 'System'];

const typeIcons = {
  Email: Mail,
  SMS: MessageSquare,
  System: Monitor,
};

export default function Notifications() {
  const location = useLocation();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppContext();
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeNotification, setActiveNotification] = useState(null);
  const itemRefs = useRef({});

  const filtered = useMemo(
    () => notifications.filter((item) => activeFilter === 'All' || item.type === activeFilter),
    [notifications, activeFilter]
  );

  useEffect(() => {
    const focusId = location.state?.focusNotificationId;
    if (focusId && itemRefs.current[focusId]) {
      itemRefs.current[focusId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      itemRefs.current[focusId].classList.add('notifications-page__item--focused');
      window.setTimeout(() => {
        itemRefs.current[focusId]?.classList.remove('notifications-page__item--focused');
      }, 1800);
    }
  }, [location.state, filtered]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const openNotification = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    setActiveNotification({ ...notification, read: true });
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="notifications-page__header-row">
          <div>
            <h1>Notifications</h1>
            <p>Unread and historical alerts streamed from the live notification database.</p>
          </div>
          <div className="notifications-page__header-actions">
            <div className="notifications-page__unread-badge">
              <Bell size={16} />
              {unreadCount} unread
            </div>
            <button className="btn-secondary" onClick={() => markAllNotificationsRead()}>
              Mark all as read
            </button>
          </div>
        </div>
      </div>

      <div className="notifications-page__filters animate-fade-in-up">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`notifications-page__filter ${activeFilter === filter ? 'notifications-page__filter--active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter !== 'All' && (() => {
              const Icon = typeIcons[filter];
              return <Icon size={14} />;
            })()}
            {filter}
          </button>
        ))}
      </div>

      <div className="notifications-page__timeline">
        {filtered.map((notification, index) => {
          const Icon = typeIcons[notification.type] || Monitor;
          return (
            <button
              key={notification.id}
              ref={(element) => { itemRefs.current[notification.id] = element; }}
              className={`notifications-page__item glass-card animate-fade-in-up ${notification.read ? '' : 'notifications-page__item--unread'}`}
              style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              onClick={() => openNotification(notification)}
            >
              <div className={`notifications-page__icon notifications-page__icon--${notification.type.toLowerCase()}`}>
                <Icon size={18} />
              </div>
              <div className="notifications-page__content">
                <div className="notifications-page__top-row">
                  <h4 className="notifications-page__title">{notification.title}</h4>
                  <div className="notifications-page__meta">
                    <StatusBadge status={notification.type} size="sm" />
                    <span className="notifications-page__time">{new Date(notification.sent_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="notifications-page__message">{notification.message}</p>
              </div>
              {!notification.read && <div className="notifications-page__unread-dot" />}
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        title={activeNotification?.title || 'Notification'}
        width="520px"
      >
        {activeNotification && (
          <div className="notifications-page__modal">
            <div className={`notifications-page__severity notifications-page__severity--${activeNotification.severity}`}>
              {activeNotification.severity}
            </div>
            <p>{activeNotification.message}</p>
            <span className="notifications-page__time">{new Date(activeNotification.sent_at).toLocaleString()}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}
