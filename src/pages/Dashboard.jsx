import { Bell, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAppContext } from '../context/useAppContext';
import './Dashboard.css';

const pieColors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function groupLast7Days(orders) {
  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: 0,
      revenue: 0,
    };
  });

  orders.forEach((order) => {
    const key = new Date(order.created_at).toISOString().slice(0, 10);
    const bucket = days.find((item) => item.key === key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += order.total;
    }
  });

  return days.map((day) => ({
    day: day.day,
    orders: day.orders,
    revenue: Number(day.revenue.toFixed(2)),
  }));
}

export default function Dashboard() {
  const { orders, products, notifications } = useAppContext();

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const unreadAlerts = notifications.filter((item) => !item.read).length;
  const lowStockProducts = products.filter((item) => item.stock <= item.threshold);
  const chartData = groupLast7Days(orders);
  const categoryData = products.reduce((acc, product) => {
    const current = acc.find((item) => item.name === product.category);
    const value = product.price * product.stock;
    if (current) {
      current.value += value;
    } else {
      acc.push({ name: product.category, value });
    }
    return acc;
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Live order, revenue, inventory, and alert activity from the database.</p>
      </div>

      <div className="grid-4">
        <StatCard icon={ShoppingCart} label="Live Orders" value={orders.length} change={12} color="blue" delay={0.05} />
        <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(2)}`} change={8} color="green" delay={0.1} />
        <StatCard icon={Package} label="Inventory Items" value={products.length} change={4} color="purple" delay={0.15} />
        <StatCard icon={Bell} label="Unread Alerts" value={unreadAlerts} change={-3} color="amber" delay={0.2} />
      </div>

      <div className="dashboard__charts">
        <div className="glass-card dashboard__chart-card animate-fade-in-up stagger-4">
          <div className="dashboard__chart-header">
            <div>
              <h3>Orders and Revenue</h3>
              <p className="dashboard__chart-subtitle">Rolling 7-day database trend</p>
            </div>
          </div>
          <div className="dashboard__chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card dashboard__pie-card animate-fade-in-up stagger-5">
          <div className="dashboard__chart-header">
            <div>
              <h3>Inventory Value by Category</h3>
              <p className="dashboard__chart-subtitle">Computed from live product data</p>
            </div>
          </div>
          <div className="dashboard__pie-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={52}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard__pie-legend">
              {categoryData.map((category, index) => (
                <div key={category.name} className="dashboard__pie-legend-item">
                  <span className="dashboard__legend-dot" style={{ background: pieColors[index % pieColors.length] }} />
                  <span className="dashboard__pie-legend-name">{category.name}</span>
                  <span className="dashboard__pie-legend-value">${category.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard__bottom">
        <div className="glass-card dashboard__recent-orders animate-fade-in-up stagger-6">
          <div className="dashboard__section-header">
            <h3>Recent Orders</h3>
            <Link to="/orders" className="dashboard__view-all">View All</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer.name}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td><StatusBadge status={order.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card dashboard__service-health animate-fade-in-up stagger-6">
          <div className="dashboard__section-header">
            <h3>Inventory Watchlist</h3>
            <Link to="/inventory" className="dashboard__view-all">Open Inventory</Link>
          </div>
          <div className="dashboard__services-list">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="dashboard__service-item">
                <div className="dashboard__service-info">
                  <div className="dashboard__service-name">{product.name}</div>
                  <div className="dashboard__service-tech">{product.category} · SKU {product.sku}</div>
                </div>
                <div className="dashboard__service-metrics">
                  <span className="dashboard__service-latency">{product.stock} left</span>
                  <StatusBadge status={product.stock <= 3 ? 'Cancelled' : 'Processing'} size="sm" />
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="dashboard__service-item">
                <div className="dashboard__service-info">
                  <div className="dashboard__service-name">No low-stock items</div>
                  <div className="dashboard__service-tech">Everything is above threshold.</div>
                </div>
                <div className="dashboard__service-metrics">
                  <TrendingUp size={16} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
