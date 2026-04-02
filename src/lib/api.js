const ORDER_BASE = 'http://localhost:8081';
const INVENTORY_BASE = 'http://localhost:8082';
const NOTIFICATION_BASE = 'http://localhost:8083';

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.error || body.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getOrders: () => request(ORDER_BASE, '/orders'),
  createOrder: (payload) =>
    request(ORDER_BASE, '/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getCustomers: () => request(ORDER_BASE, '/customers'),
  getProducts: () => request(INVENTORY_BASE, '/inventory'),
  createProduct: (payload) =>
    request(INVENTORY_BASE, '/inventory', { method: 'POST', body: JSON.stringify(payload) }),
  updateProductStock: (id, payload) =>
    request(INVENTORY_BASE, `/inventory/${id}/stock`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(INVENTORY_BASE, `/inventory/${id}`, { method: 'DELETE' }),
  getNotifications: () => request(NOTIFICATION_BASE, '/notifications'),
  markNotificationRead: (id) =>
    request(NOTIFICATION_BASE, `/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request(NOTIFICATION_BASE, '/notifications/read-all', { method: 'PATCH' }),
  getProfile: () => request(NOTIFICATION_BASE, '/profile'),
  addEmergencyContact: (payload) =>
    request(NOTIFICATION_BASE, '/profile/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEmergencyContact: (id, payload) =>
    request(NOTIFICATION_BASE, `/profile/emergency-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteEmergencyContact: (id) =>
    request(NOTIFICATION_BASE, `/profile/emergency-contacts/${id}`, { method: 'DELETE' }),
};
