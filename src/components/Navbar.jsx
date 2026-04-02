import { useMemo, useState } from 'react';
import { Bell, Moon, Search, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import Modal from './Modal';
import './Navbar.css';

function formatTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Navbar() {
  const navigate = useNavigate();
  const {
    notifications,
    orders,
    customers,
    products,
    profile,
    theme,
    setTheme,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [search, setSearch] = useState('');

  const unreadCount = notifications.filter((item) => !item.read).length;
  const recentNotifications = useMemo(() => notifications.slice(0, 6), [notifications]);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    const results = [];
    orders.forEach((order) => {
      if (
        String(order.id).includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.product.name.toLowerCase().includes(query)
      ) {
        results.push({ type: 'Order', label: `Order #${order.id}`, description: `${order.customer.name} · ${order.product.name}`, action: () => navigate('/orders') });
      }
    });
    products.forEach((product) => {
      if (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      ) {
        results.push({ type: 'Product', label: product.name, description: `${product.sku} · ${product.stock} in stock`, action: () => navigate('/inventory') });
      }
    });
    customers.forEach((customer) => {
      if (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      ) {
        results.push({ type: 'Customer', label: customer.name, description: customer.email, action: () => navigate('/orders') });
      }
    });
    notifications.forEach((notification) => {
      if (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'Notification',
          label: notification.title,
          description: notification.message,
          action: () => navigate('/notifications', { state: { focusNotificationId: notification.id } }),
        });
      }
    });
    return results.slice(0, 8);
  }, [search, orders, products, customers, notifications, navigate]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    setActiveNotification({ ...notification, read: true });
    setDropdownOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar__search">
          <Search size={18} className="navbar__search-icon" />
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className="navbar__search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.trim() && (
            <div className="glass-card navbar__search-results">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${index}`}
                  className="navbar__search-result"
                  onClick={() => {
                    result.action();
                    setSearch('');
                  }}
                >
                  <div className="navbar__search-result-top">
                    <span>{result.label}</span>
                    <span>{result.type}</span>
                  </div>
                  <p>{result.description}</p>
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="navbar__empty-state">No matches found.</div>
              )}
            </div>
          )}
        </div>

        <div className="navbar__actions">
          <button
            className="navbar__icon-btn"
            aria-label="Toggle color mode"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="navbar__notification-wrap">
            <button
              className="navbar__icon-btn"
              aria-label="Notifications"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="navbar__badge">{unreadCount}</span>}
            </button>

            {dropdownOpen && (
              <div className="glass-card navbar__dropdown">
                <div className="navbar__dropdown-header">
                  <div>
                    <h4>Notifications</h4>
                    <p>{unreadCount} unread</p>
                  </div>
                  <div className="navbar__dropdown-actions">
                    <button className="navbar__link-btn" onClick={() => markAllNotificationsRead()}>
                      Mark all read
                    </button>
                    <button className="navbar__link-btn" onClick={() => navigate('/notifications')}>
                      Open page
                    </button>
                  </div>
                </div>
                <div className="navbar__dropdown-list">
                  {recentNotifications.map((item) => (
                    <button
                      key={item.id}
                      className={`navbar__dropdown-item ${item.read ? '' : 'navbar__dropdown-item--unread'}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="navbar__dropdown-top">
                        <span>{item.title}</span>
                        <span>{formatTime(item.sent_at)}</span>
                      </div>
                      <p>{item.message}</p>
                    </button>
                  ))}
                  {recentNotifications.length === 0 && (
                    <div className="navbar__empty-state">No notifications yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="navbar__divider" />

          <button className="navbar__user" onClick={() => navigate('/profile')}>
            <div className="navbar__avatar">
              <User size={16} />
            </div>
            <div className="navbar__user-info">
              <span className="navbar__user-name">{profile?.name || 'Admin'}</span>
              <span className="navbar__user-role">{profile?.role || 'System Operator'}</span>
            </div>
          </button>
        </div>
      </header>

      <Modal
        isOpen={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        title={activeNotification?.title || 'Notification'}
        width="540px"
      >
        {activeNotification && (
          <div className="navbar__notification-modal">
            <div className={`navbar__severity navbar__severity--${activeNotification.severity}`}>
              {activeNotification.severity}
            </div>
            <p className="navbar__notification-message">{activeNotification.message}</p>
            <div className="navbar__notification-meta">{formatTime(activeNotification.sent_at)}</div>
            <button
              className="btn-primary"
              onClick={() => {
                navigate('/notifications', {
                  state: { focusNotificationId: activeNotification.id },
                });
                setActiveNotification(null);
              }}
            >
              Open in Notifications
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
