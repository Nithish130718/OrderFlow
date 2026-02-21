import { Search, Bell, User } from 'lucide-react';
import { notifications } from '../data/mockData';
import './Navbar.css';

export default function Navbar() {
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <header className="navbar">
            <div className="navbar__search">
                <Search size={16} className="navbar__search-icon" />
                <input
                    type="text"
                    placeholder="Search orders, products, customers..."
                    className="navbar__search-input"
                />
            </div>

            <div className="navbar__actions">
                <button className="navbar__icon-btn" aria-label="Notifications">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="navbar__badge">{unreadCount}</span>
                    )}
                </button>

                <div className="navbar__divider" />

                <button className="navbar__user">
                    <div className="navbar__avatar">
                        <User size={16} />
                    </div>
                    <div className="navbar__user-info">
                        <span className="navbar__user-name">Admin</span>
                        <span className="navbar__user-role">System Operator</span>
                    </div>
                </button>
            </div>
        </header>
    );
}
