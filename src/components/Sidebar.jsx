import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Bell,
    Server,
    ChevronLeft,
    ChevronRight,
    Zap,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/services', icon: Server, label: 'Services' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">
                        <Zap size={20} />
                    </div>
                    {!collapsed && <span className="sidebar__logo-text">OrderFlow</span>}
                </div>
                <button
                    className="sidebar__toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle sidebar"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="sidebar__nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                        >
                            <div className="sidebar__link-icon">
                                <Icon size={20} />
                            </div>
                            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
                            {isActive && <div className="sidebar__active-indicator" />}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar__footer">
                {!collapsed && (
                    <div className="sidebar__version">
                        <span className="sidebar__version-dot" />
                        v1.0.0 — Microservices
                    </div>
                )}
            </div>
        </aside>
    );
}
