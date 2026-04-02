import { useMemo, useState } from 'react';
import { CreditCard, Eye, Minus, Package, Plus, Search, Tag } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAppContext } from '../context/useAppContext';
import './Orders.css';

const statusFilters = ['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const initialForm = {
  customer_id: '',
  product_id: '',
  quantity: 1,
  discount_code: '',
  payment_method: 'Credit Card',
};

export default function Orders() {
  const { orders, customers, products, createOrder } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const availableProducts = products.filter((item) => item.stock > 0);
  const selectedProduct = products.find((item) => item.id === Number(form.product_id));
  const selectedCustomer = customers.find((item) => item.id === Number(form.customer_id));

  const filtered = orders.filter((order) => {
    const matchesSearch =
      String(order.id).includes(search.trim()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || order.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const estimatedSubtotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * form.quantity;
  }, [selectedProduct, form.quantity]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      await createOrder({
        ...form,
        customer_id: Number(form.customer_id),
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
      });
      setConfirmOrder(false);
      setShowPlaceOrder(false);
      setForm(initialForm);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div className="orders-page__header-row">
          <div>
            <h1>Orders</h1>
            <p>Create and monitor live orders stored in the database.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowPlaceOrder(true)}>
            <Plus size={16} /> Place Order
          </button>
        </div>
      </div>

      <div className="orders-page__toolbar glass-card animate-fade-in-up">
        <div className="orders-page__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="orders-page__filters">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              className={`orders-page__filter-btn ${activeFilter === filter ? 'orders-page__filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card orders-page__table-card animate-fade-in-up stagger-2">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status</th>
              <th>Placed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td><span className="orders-page__order-id">#{order.id}</span></td>
                <td>
                  <div className="orders-page__customer">
                    <div className="orders-page__customer-avatar">{order.customer.avatar}</div>
                    <div>
                      <div className="orders-page__customer-name">{order.customer.name}</div>
                      <div className="orders-page__customer-email">{order.customer.email}</div>
                    </div>
                  </div>
                </td>
                <td>{order.product.name}</td>
                <td className="orders-page__total">${order.total.toFixed(2)}</td>
                <td><StatusBadge status={order.status} /></td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <button className="orders-page__view-btn" onClick={() => setSelectedOrder(order)}>
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.id || ''}`} width="620px">
        {selectedOrder && (
          <div className="order-detail">
            <div className="order-detail__status-row">
              <StatusBadge status={selectedOrder.status} />
              <span className="order-detail__date">{new Date(selectedOrder.created_at).toLocaleString()}</span>
            </div>
            <div className="order-detail__section">
              <h4>Customer</h4>
              <div className="order-detail__info">
                <span>{selectedOrder.customer.name}</span>
                <span className="order-detail__muted">{selectedOrder.customer.email}</span>
              </div>
            </div>
            <div className="order-detail__section">
              <h4>Product</h4>
              <div className="order-detail__item">
                <span className="order-detail__item-emoji">{selectedOrder.product.image}</span>
                <div className="order-detail__item-info">
                  <span>{selectedOrder.product.name}</span>
                  <span className="order-detail__muted">
                    Qty: {selectedOrder.quantity} x ${selectedOrder.product.price.toFixed(2)}
                  </span>
                </div>
                <span className="order-detail__item-total">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="order-detail__summary">
              <div className="order-detail__summary-row">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {!!selectedOrder.discount_code && (
                <div className="order-detail__summary-row order-detail__summary-row--discount">
                  <span><Tag size={12} /> {selectedOrder.discount_code}</span>
                  <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="order-detail__summary-row order-detail__summary-row--total">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="order-detail__payment">
              <CreditCard size={14} /> Paid via {selectedOrder.payment_method}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPlaceOrder} onClose={() => setShowPlaceOrder(false)} title="Place New Order" width="560px">
        <form
          className="place-order-form"
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOrder(true);
          }}
        >
          <div className="place-order-form__field">
            <label>Customer</label>
            <select
              value={form.customer_id}
              onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div className="place-order-form__field">
            <label>Product</label>
            <select
              value={form.product_id}
              onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))}
              required
            >
              <option value="">Select product</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · ${product.price.toFixed(2)} · {product.stock} in stock
                </option>
              ))}
            </select>
          </div>

          <div className="place-order-form__row">
            <div className="place-order-form__field">
              <label>Quantity</label>
              <div className="place-order-form__quantity-control">
                <button
                  type="button"
                  className="place-order-form__qty-btn"
                  onClick={() => setForm((current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))}
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock || undefined}
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) || 1 }))}
                />
                <button
                  type="button"
                  className="place-order-form__qty-btn"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      quantity: selectedProduct ? Math.min(selectedProduct.stock, current.quantity + 1) : current.quantity + 1,
                    }))
                  }
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="place-order-form__field">
              <label>Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}
              >
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>UPI</option>
                <option>PayPal</option>
              </select>
            </div>
          </div>

          <div className="place-order-form__field">
            <label>Discount Code</label>
            <input
              type="text"
              value={form.discount_code}
              onChange={(event) => setForm((current) => ({ ...current, discount_code: event.target.value }))}
              placeholder="Optional: SAVE10, FLOW20, NEWUSER15"
            />
          </div>

          <div className="place-order-form__summary glass-card">
            <div>
              <strong>{selectedProduct?.name || 'Choose a product'}</strong>
              <p>{selectedCustomer ? `${selectedCustomer.name} · ${selectedCustomer.email}` : 'Choose a customer to continue'}</p>
            </div>
            <div className="place-order-form__summary-total">${estimatedSubtotal.toFixed(2)}</div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Package size={16} /> Confirm Order
          </button>
        </form>
      </Modal>

      <Modal isOpen={confirmOrder} onClose={() => setConfirmOrder(false)} title="Confirm Order" width="480px">
        <div className="orders-page__confirm">
          <p>
            Place this order for <strong>{selectedCustomer?.name || 'selected customer'}</strong> with{' '}
            <strong>{form.quantity}</strong> unit(s) of <strong>{selectedProduct?.name || 'selected product'}</strong>?
          </p>
          <div className="orders-page__confirm-actions">
            <button className="btn-secondary" onClick={() => setConfirmOrder(false)}>Cancel</button>
            <button className="btn-primary" onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
