import {
    ShoppingCart,
    DollarSign,
    Package,
    Bell,
    TrendingUp,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
    dashboardStats,
    ordersChartData,
    revenueByCategory,
    orders,
    services,
} from '../data/mockData';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip glass-card">
            <p className="chart-tooltip__label">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="chart-tooltip__value" style={{ color: entry.color }}>
                    {entry.name}: {entry.name === 'revenue' ? `$${entry.value.toLocaleString()}` : entry.value}
                </p>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const formatRevenue = (val) => {
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val}`;
    };

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Real-time overview of your order management system</p>
            </div>

            {/* Stats */}
            <div className="grid-4">
                <StatCard
                    icon={ShoppingCart}
                    label="Total Orders"
                    value={dashboardStats.totalOrders.toLocaleString()}
                    change={dashboardStats.ordersChange}
                    color="blue"
                    delay={0.05}
                />
                <StatCard
                    icon={DollarSign}
                    label="Total Revenue"
                    value={`$${(dashboardStats.revenue / 1000).toFixed(1)}k`}
                    change={dashboardStats.revenueChange}
                    color="green"
                    delay={0.1}
                />
                <StatCard
                    icon={Package}
                    label="Active Products"
                    value={dashboardStats.activeProducts}
                    change={dashboardStats.productsChange}
                    color="purple"
                    delay={0.15}
                />
                <StatCard
                    icon={Bell}
                    label="Pending Alerts"
                    value={dashboardStats.pendingAlerts}
                    change={dashboardStats.alertsChange}
                    color="amber"
                    delay={0.2}
                />
            </div>

            {/* Charts Row */}
            <div className="dashboard__charts">
                {/* Orders Chart */}
                <div className="glass-card dashboard__chart-card animate-fade-in-up stagger-4">
                    <div className="dashboard__chart-header">
                        <div>
                            <h3>Orders Trend</h3>
                            <p className="dashboard__chart-subtitle">Last 7 days</p>
                        </div>
                        <div className="dashboard__chart-legend">
                            <span className="dashboard__legend-item">
                                <span className="dashboard__legend-dot" style={{ background: '#3b82f6' }} />
                                Orders
                            </span>
                            <span className="dashboard__legend-item">
                                <span className="dashboard__legend-dot" style={{ background: '#06b6d4' }} />
                                Revenue
                            </span>
                        </div>
                    </div>
                    <div className="dashboard__chart-body">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={ordersChartData}>
                                <defs>
                                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={formatRevenue}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#ordersGradient)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="glass-card dashboard__pie-card animate-fade-in-up stagger-5">
                    <div className="dashboard__chart-header">
                        <div>
                            <h3>Revenue by Category</h3>
                            <p className="dashboard__chart-subtitle">Distribution</p>
                        </div>
                    </div>
                    <div className="dashboard__pie-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={revenueByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `$${value.toLocaleString()}`}
                                    contentStyle={{
                                        background: 'rgba(17,24,39,0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#f1f5f9',
                                        fontSize: '13px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="dashboard__pie-legend">
                            {revenueByCategory.map((cat) => (
                                <div key={cat.name} className="dashboard__pie-legend-item">
                                    <span className="dashboard__legend-dot" style={{ background: cat.color }} />
                                    <span className="dashboard__pie-legend-name">{cat.name}</span>
                                    <span className="dashboard__pie-legend-value">${(cat.value / 1000).toFixed(1)}k</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="dashboard__bottom">
                {/* Recent Orders */}
                <div className="glass-card dashboard__recent-orders animate-fade-in-up stagger-6">
                    <div className="dashboard__section-header">
                        <h3>Recent Orders</h3>
                        <a href="/orders" className="dashboard__view-all">View All →</a>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 6).map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{order.id}</span>
                                    </td>
                                    <td>{order.customer.name}</td>
                                    <td>${order.total.toFixed(2)}</td>
                                    <td><StatusBadge status={order.status} size="sm" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Service Health */}
                <div className="glass-card dashboard__service-health animate-fade-in-up stagger-6">
                    <div className="dashboard__section-header">
                        <h3>Service Health</h3>
                        <a href="/services" className="dashboard__view-all">Details →</a>
                    </div>
                    <div className="dashboard__services-list">
                        {services.map((svc) => (
                            <div key={svc.name} className="dashboard__service-item">
                                <div className="dashboard__service-info">
                                    <div className="dashboard__service-name">{svc.name}</div>
                                    <div className="dashboard__service-tech">{svc.tech} · Port {svc.port}</div>
                                </div>
                                <div className="dashboard__service-metrics">
                                    <span className="dashboard__service-latency">{svc.latency}</span>
                                    <StatusBadge status={svc.status} size="sm" />
                                </div>
                            </div>
                        ))}
                        <div className="dashboard__service-item">
                            <div className="dashboard__service-info">
                                <div className="dashboard__service-name">Redis Cache</div>
                                <div className="dashboard__service-tech">In-memory · Port 6379</div>
                            </div>
                            <div className="dashboard__service-metrics">
                                <span className="dashboard__service-latency">94.2% hit</span>
                                <StatusBadge status="Connected" size="sm" />
                            </div>
                        </div>
                        <div className="dashboard__service-item">
                            <div className="dashboard__service-info">
                                <div className="dashboard__service-name">Apache Kafka</div>
                                <div className="dashboard__service-tech">Event Broker · 3 Brokers</div>
                            </div>
                            <div className="dashboard__service-metrics">
                                <span className="dashboard__service-latency">245 msg/s</span>
                                <StatusBadge status="Running" size="sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
