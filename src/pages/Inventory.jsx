import { useMemo, useState } from 'react';
import { AlertTriangle, Package, Plus, Search, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAppContext } from '../context/useAppContext';
import './Inventory.css';

const blankProduct = {
  name: '',
  sku: '',
  category: 'Electronics',
  description: '',
  image: 'PR',
  price: 0,
  stock: 0,
  threshold: 10,
};

export default function Inventory() {
  const { products, createProduct, deleteProduct } = useAppContext();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [form, setForm] = useState(blankProduct);

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.sku.toLowerCase().includes(search.toLowerCase()) ||
          product.category.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const criticalProducts = products.filter((item) => item.stock <= item.threshold);

  const getStockLevel = (product) => {
    if (product.stock === 0) return 'out';
    if (product.stock <= Math.max(3, Math.floor(product.threshold / 2))) return 'critical';
    if (product.stock <= product.threshold) return 'low';
    return 'good';
  };

  const handleCreate = async () => {
    await createProduct({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      threshold: Number(form.threshold),
    });
    setShowAdd(false);
    setConfirmCreate(false);
    setForm(blankProduct);
  };

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="inventory-page__header-row">
          <div>
            <h1>Inventory</h1>
            <p>Detailed product, stock, threshold, and catalog visibility from the database.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="glass-card inventory-page__search-bar animate-fade-in-up">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search products, categories, or SKUs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {criticalProducts.length > 0 && (
        <div className="inventory-page__alerts animate-fade-in-up stagger-1">
          <div className="inventory-page__alert-header">
            <AlertTriangle size={16} />
            <span>Inventory Alerts</span>
          </div>
          <div className="inventory-page__alert-items">
            {criticalProducts.map((product) => (
              <div key={product.id} className={`inventory-page__alert-item inventory-page__alert-item--${getStockLevel(product)}`}>
                <span className="inventory-page__alert-emoji">{product.image}</span>
                <span className="inventory-page__alert-name">{product.name}</span>
                <span className="inventory-page__alert-stock">
                  {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inventory-page__grid">
        {filtered.map((product, index) => (
          <div
            key={product.id}
            className="glass-card inventory-page__product animate-fade-in-up"
            style={{ animationDelay: `${0.05 * (index + 1)}s` }}
          >
            <div className="inventory-page__product-top">
              <span className="inventory-page__product-emoji">{product.image}</span>
              <span className={`inventory-page__stock-tag inventory-page__stock-tag--${getStockLevel(product)}`}>
                {product.stock} in stock
              </span>
            </div>

            <h3 className="inventory-page__product-name">{product.name}</h3>
            <p className="inventory-page__product-description">{product.description}</p>

            <div className="inventory-page__product-meta">
              <span className="inventory-page__sku">{product.sku}</span>
              <span className="inventory-page__category">{product.category}</span>
            </div>

            <div className="inventory-page__stats">
              <div>
                <span>Price</span>
                <strong>${product.price.toFixed(2)}</strong>
              </div>
              <div>
                <span>Threshold</span>
                <strong>{product.threshold}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{new Date(product.updated_at).toLocaleDateString()}</strong>
              </div>
            </div>

            <div className="inventory-page__stock-bar-wrap">
              <div
                className={`inventory-page__stock-bar inventory-page__stock-bar--${getStockLevel(product)}`}
                style={{ width: `${Math.min((product.stock / Math.max(product.threshold * 3, 1)) * 100, 100)}%` }}
              />
            </div>

            <button className="inventory-page__delete-btn" onClick={() => setConfirmDelete(product)}>
              <Trash2 size={16} /> Delete item
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Product" width="560px">
        <form
          className="add-product-form"
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmCreate(true);
          }}
        >
          <div className="place-order-form__field">
            <label>Product Name</label>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className="place-order-form__row">
            <div className="place-order-form__field">
              <label>SKU</label>
              <input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} required />
            </div>
            <div className="place-order-form__field">
              <label>Category</label>
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
            </div>
          </div>
          <div className="place-order-form__field">
            <label>Description</label>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="3" />
          </div>
          <div className="place-order-form__row">
            <div className="place-order-form__field">
              <label>Price</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
            </div>
            <div className="place-order-form__field">
              <label>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} />
            </div>
          </div>
          <div className="place-order-form__row">
            <div className="place-order-form__field">
              <label>Threshold</label>
              <input type="number" min="0" value={form.threshold} onChange={(event) => setForm((current) => ({ ...current, threshold: event.target.value }))} />
            </div>
            <div className="place-order-form__field">
              <label>Badge</label>
              <input value={form.image} maxLength="2" onChange={(event) => setForm((current) => ({ ...current, image: event.target.value.toUpperCase() }))} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Package size={16} /> Review Product
          </button>
        </form>
      </Modal>

      <Modal isOpen={confirmCreate} onClose={() => setConfirmCreate(false)} title="Confirm Product" width="440px">
        <div className="inventory-page__confirm">
          <p>Add <strong>{form.name}</strong> to inventory with <strong>{form.stock}</strong> units in stock?</p>
          <div className="inventory-page__confirm-actions">
            <button className="btn-secondary" onClick={() => setConfirmCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate}>Add Product</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Product" width="440px">
        {confirmDelete && (
          <div className="inventory-page__confirm">
            <p>Delete <strong>{confirmDelete.name}</strong> from inventory and database?</p>
            <div className="inventory-page__confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await deleteProduct(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                Delete Item
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
