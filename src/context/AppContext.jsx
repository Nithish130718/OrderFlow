import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { AppContext } from './context';

function normalizeError(error) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('orderflow-theme') || 'dark');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, customersRes, productsRes, notificationsRes, profileRes] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getProducts(),
        api.getNotifications(),
        api.getProfile(),
      ]);

      setOrders(ordersRes.orders || []);
      setCustomers(customersRes.customers || []);
      setProducts(productsRes.products || []);
      setNotifications(notificationsRes.notifications || []);
      setProfile(profileRes.profile || null);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('orderflow-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    orders,
    customers,
    products,
    notifications,
    profile,
    loading,
    error,
    theme,
    setTheme,
    refreshAll: fetchAll,
    async createOrder(payload) {
      const response = await api.createOrder(payload);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      await fetchAll();
      return response.order;
    },
    async createProduct(payload) {
      const response = await api.createProduct(payload);
      await fetchAll();
      return response.product;
    },
    async updateProductStock(id, payload) {
      const response = await api.updateProductStock(id, payload);
      await fetchAll();
      return response.product;
    },
    async deleteProduct(id) {
      await api.deleteProduct(id);
      await fetchAll();
    },
    async markNotificationRead(id) {
      await api.markNotificationRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    },
    async markAllNotificationsRead() {
      await api.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    },
    async addEmergencyContact(payload) {
      await api.addEmergencyContact(payload);
      await fetchAll();
    },
    async updateEmergencyContact(id, payload) {
      await api.updateEmergencyContact(id, payload);
      await fetchAll();
    },
    async deleteEmergencyContact(id) {
      await api.deleteEmergencyContact(id);
      await fetchAll();
    },
  }), [orders, customers, products, notifications, profile, loading, error, theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
