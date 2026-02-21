import { useState } from 'react';
import {
    Search,
    Plus,
    AlertTriangle,
    Package as PackageIcon,
} from 'lucide-react';
import Modal from '../components/Modal';
import { products } from '../data/mockData';
import './Inventory.css';

export default function Inventory() {
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
    );

    const getStockLevel = (stock) => {
        if (stock === 0) return 'out';
        if (stock <= 10) return 'critical';
        if (stock <= 50) return 'low';
        return 'good';
    };

    const getStockWidth = (stock) => {
        const max = 400;
        return Math.min((stock / max) * 100, 100);
    };

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div className="inventory-page__header-row">
                    <div>
                        <h1>Inventory</h1>
                        <p>Product catalog and stock management</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="glass-card inventory-page__search-bar animate-fade-in-up">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Stock Alerts */}
            {products.filter((p) => p.stock <= 10).length > 0 && (
                <div className="inventory-page__alerts animate-fade-in-up stagger-1">
                    <div className="inventory-page__alert-header">
                        <AlertTriangle size={16} />
                        <span>Stock Alerts</span>
                    </div>
                    <div className="inventory-page__alert-items">
                        {products
                            .filter((p) => p.stock <= 10)
                            .map((p) => (
                                <div key={p.id} className={`inventory-page__alert-item inventory-page__alert-item--${getStockLevel(p.stock)}`}>
                                    <span className="inventory-page__alert-emoji">{p.image}</span>
                                    <span className="inventory-page__alert-name">{p.name}</span>
                                    <span className="inventory-page__alert-stock">
                                        {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Product Grid */}
            <div className="inventory-page__grid">
                {filtered.map((product, i) => (
                    <div
                        key={product.id}
                        className={`glass-card inventory-page__product animate-fade-in-up`}
                        style={{ animationDelay: `${0.05 * (i + 1)}s` }}
                    >
                        <div className="inventory-page__product-top">
                            <span className="inventory-page__product-emoji">{product.image}</span>
                            <span className={`inventory-page__stock-tag inventory-page__stock-tag--${getStockLevel(product.stock)}`}>
                                {product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
                            </span>
                        </div>
                        <h3 className="inventory-page__product-name">{product.name}</h3>
                        <div className="inventory-page__product-meta">
                            <span className="inventory-page__sku">{product.sku}</span>
                            <span className="inventory-page__category">{product.category}</span>
                        </div>
                        <div className="inventory-page__product-price">${product.price.toFixed(2)}</div>
                        <div className="inventory-page__stock-bar-wrap">
                            <div
                                className={`inventory-page__stock-bar inventory-page__stock-bar--${getStockLevel(product.stock)}`}
                                style={{ width: `${getStockWidth(product.stock)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="inventory-page__empty glass-card">
                    <PackageIcon size={40} />
                    <p>No products found</p>
                </div>
            )}

            {/* Add Product Modal */}
            <Modal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                title="Add New Product"
            >
                <form className="add-product-form" onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
                    <div className="place-order-form__field">
                        <label>Product Name</label>
                        <input type="text" placeholder="e.g. Wireless Headphones Pro" />
                    </div>
                    <div className="place-order-form__row">
                        <div className="place-order-form__field">
                            <label>SKU</label>
                            <input type="text" placeholder="e.g. WHP-100" />
                        </div>
                        <div className="place-order-form__field">
                            <label>Price ($)</label>
                            <input type="number" min="0" step="0.01" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="place-order-form__row">
                        <div className="place-order-form__field">
                            <label>Category</label>
                            <select defaultValue="">
                                <option value="" disabled>Select category</option>
                                <option>Electronics</option>
                                <option>Wearables</option>
                                <option>Accessories</option>
                                <option>Storage</option>
                            </select>
                        </div>
                        <div className="place-order-form__field">
                            <label>Initial Stock</label>
                            <input type="number" min="0" defaultValue="100" />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                        <PackageIcon size={16} /> Add Product
                    </button>
                </form>
            </Modal>
        </div>
    );
}
