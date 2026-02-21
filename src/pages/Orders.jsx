import { useState } from 'react';
import {
    ShoppingCart,
    Plus,
    Search,
    Filter,
    Eye,
    Clock,
    CreditCard,
    Tag,
    Package,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { orders, products, users } from '../data/mockData';
import './Orders.css';

const statusFilters = ['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPlaceOrder, setShowPlaceOrder] = useState(false);

    const filtered = orders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === 'All' || order.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="orders-page">
            <div className="page-header">
                <div className="orders-page__header-row">
                    <div>
                        <h1>Orders</h1>
                        <p>Manage and track all customer orders</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowPlaceOrder(true)}>
                        <Plus size={16} /> Place Order
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="orders-page__toolbar glass-card animate-fade-in-up">
                <div className="orders-page__search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by order ID or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="orders-page__filters">
                    {statusFilters.map((f) => (
                        <button
                            key={f}
                            className={`orders-page__filter-btn ${activeFilter === f ? 'orders-page__filter-btn--active' : ''}`}
                            onClick={() => setActiveFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card orders-page__table-card animate-fade-in-up stagger-2">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Discount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <span className="orders-page__order-id">{order.id}</span>
                                </td>
                                <td>
                                    <div className="orders-page__customer">
                                        <div className="orders-page__customer-avatar">{order.customer.avatar}</div>
                                        <div>
                                            <div className="orders-page__customer-name">{order.customer.name}</div>
                                            <div className="orders-page__customer-email">{order.customer.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                                <td className="orders-page__total">${order.total.toFixed(2)}</td>
                                <td>
                                    {order.discount ? (
                                        <span className="orders-page__discount">
                                            <Tag size={12} /> {order.discount}
                                        </span>
                                    ) : (
                                        <span className="orders-page__no-discount">—</span>
                                    )}
                                </td>
                                <td><StatusBadge status={order.status} /></td>
                                <td>{formatDate(order.date)}</td>
                                <td>
                                    <button className="orders-page__view-btn" onClick={() => setSelectedOrder(order)}>
                                        <Eye size={14} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="orders-page__empty">
                        <ShoppingCart size={40} />
                        <p>No orders found</p>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Order ${selectedOrder?.id}`}
                width="600px"
            >
                {selectedOrder && (
                    <div className="order-detail">
                        <div className="order-detail__status-row">
                            <StatusBadge status={selectedOrder.status} />
                            <span className="order-detail__date">
                                <Clock size={14} /> {formatDate(selectedOrder.date)}
                            </span>
                        </div>

                        <div className="order-detail__section">
                            <h4>Customer</h4>
                            <div className="order-detail__info">
                                <span>{selectedOrder.customer.name}</span>
                                <span className="order-detail__muted">{selectedOrder.customer.email}</span>
                            </div>
                        </div>

                        <div className="order-detail__section">
                            <h4>Items</h4>
                            <div className="order-detail__items">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="order-detail__item">
                                        <span className="order-detail__item-emoji">{item.product.image}</span>
                                        <div className="order-detail__item-info">
                                            <span>{item.product.name}</span>
                                            <span className="order-detail__muted">Qty: {item.qty} × ${item.product.price}</span>
                                        </div>
                                        <span className="order-detail__item-total">${(item.qty * item.product.price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="order-detail__summary">
                            <div className="order-detail__summary-row">
                                <span>Subtotal</span>
                                <span>${(selectedOrder.total + selectedOrder.discountAmount).toFixed(2)}</span>
                            </div>
                            {selectedOrder.discount && (
                                <div className="order-detail__summary-row order-detail__summary-row--discount">
                                    <span><Tag size={12} /> {selectedOrder.discount}</span>
                                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="order-detail__summary-row order-detail__summary-row--total">
                                <span>Total</span>
                                <span>${selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="order-detail__payment">
                            <CreditCard size={14} /> Paid via {selectedOrder.paymentMethod}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Place Order Modal */}
            <Modal
                isOpen={showPlaceOrder}
                onClose={() => setShowPlaceOrder(false)}
                title="Place New Order"
                width="520px"
            >
                <form className="place-order-form" onSubmit={(e) => { e.preventDefault(); setShowPlaceOrder(false); }}>
                    <div className="place-order-form__field">
                        <label>Customer</label>
                        <select defaultValue="">
                            <option value="" disabled>Select a customer</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="place-order-form__field">
                        <label>Product</label>
                        <select defaultValue="">
                            <option value="" disabled>Select a product</option>
                            {products.filter(p => p.stock > 0).map((p) => (
                                <option key={p.id} value={p.id}>{p.image} {p.name} — ${p.price} ({p.stock} in stock)</option>
                            ))}
                        </select>
                    </div>

                    <div className="place-order-form__row">
                        <div className="place-order-form__field">
                            <label>Quantity</label>
                            <input type="number" min="1" defaultValue="1" />
                        </div>
                        <div className="place-order-form__field">
                            <label>Discount Code</label>
                            <input type="text" placeholder="e.g. SAVE10" />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                        <Package size={16} /> Place Order
                    </button>
                </form>
            </Modal>
        </div>
    );
}
