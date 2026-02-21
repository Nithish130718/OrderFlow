// ========== Users ==========
export const users = [
  { id: 'USR-001', name: 'Alex Rivera', email: 'alex@orderflow.io', avatar: 'AR' },
  { id: 'USR-002', name: 'Priya Sharma', email: 'priya@orderflow.io', avatar: 'PS' },
  { id: 'USR-003', name: 'Marcus Chen', email: 'marcus@orderflow.io', avatar: 'MC' },
  { id: 'USR-004', name: 'Sofia Gomez', email: 'sofia@orderflow.io', avatar: 'SG' },
  { id: 'USR-005', name: 'Jordan Lee', email: 'jordan@orderflow.io', avatar: 'JL' },
  { id: 'USR-006', name: 'Emma Wilson', email: 'emma@orderflow.io', avatar: 'EW' },
  { id: 'USR-007', name: 'Raj Patel', email: 'raj@orderflow.io', avatar: 'RP' },
  { id: 'USR-008', name: 'Mia Thompson', email: 'mia@orderflow.io', avatar: 'MT' },
];

// ========== Products ==========
export const products = [
  { id: 'PRD-001', name: 'Wireless Headphones Pro', sku: 'WHP-100', price: 149.99, stock: 234, category: 'Electronics', image: '🎧' },
  { id: 'PRD-002', name: 'Ergonomic Keyboard', sku: 'EKB-200', price: 89.99, stock: 156, category: 'Electronics', image: '⌨️' },
  { id: 'PRD-003', name: 'Smart Fitness Watch', sku: 'SFW-300', price: 199.99, stock: 12, category: 'Wearables', image: '⌚' },
  { id: 'PRD-004', name: 'USB-C Hub 7-in-1', sku: 'UCH-400', price: 49.99, stock: 389, category: 'Accessories', image: '🔌' },
  { id: 'PRD-005', name: 'Noise Cancelling Buds', sku: 'NCB-500', price: 79.99, stock: 8, category: 'Electronics', image: '🎵' },
  { id: 'PRD-006', name: 'Portable SSD 1TB', sku: 'PSD-600', price: 119.99, stock: 67, category: 'Storage', image: '💾' },
  { id: 'PRD-007', name: '4K Webcam Ultra', sku: 'WCU-700', price: 169.99, stock: 45, category: 'Electronics', image: '📷' },
  { id: 'PRD-008', name: 'Standing Desk Mat', sku: 'SDM-800', price: 39.99, stock: 5, category: 'Accessories', image: '🏢' },
  { id: 'PRD-009', name: 'LED Desk Lamp', sku: 'LDL-900', price: 59.99, stock: 178, category: 'Accessories', image: '💡' },
  { id: 'PRD-010', name: 'Bluetooth Speaker', sku: 'BTS-010', price: 69.99, stock: 92, category: 'Electronics', image: '🔊' },
  { id: 'PRD-011', name: 'Laptop Stand Pro', sku: 'LSP-011', price: 44.99, stock: 203, category: 'Accessories', image: '🖥️' },
  { id: 'PRD-012', name: 'Mechanical Mouse', sku: 'MMO-012', price: 54.99, stock: 0, category: 'Electronics', image: '🖱️' },
];

// ========== Orders ==========
const statuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const discountCodes = [null, null, 'SAVE10', 'FLOW20', null, 'NEWUSER15', null, null];

export const orders = [
  { id: 'ORD-10421', customer: users[0], items: [{ product: products[0], qty: 1 }, { product: products[3], qty: 2 }], total: 249.97, discount: 'SAVE10', discountAmount: 24.99, status: 'Delivered', date: '2026-02-21T09:15:00', paymentMethod: 'Credit Card' },
  { id: 'ORD-10422', customer: users[1], items: [{ product: products[2], qty: 1 }], total: 199.99, discount: null, discountAmount: 0, status: 'Shipped', date: '2026-02-21T08:42:00', paymentMethod: 'UPI' },
  { id: 'ORD-10423', customer: users[2], items: [{ product: products[1], qty: 1 }, { product: products[5], qty: 1 }], total: 209.98, discount: 'FLOW20', discountAmount: 41.99, status: 'Processing', date: '2026-02-21T08:10:00', paymentMethod: 'Debit Card' },
  { id: 'ORD-10424', customer: users[3], items: [{ product: products[6], qty: 1 }], total: 169.99, discount: null, discountAmount: 0, status: 'Placed', date: '2026-02-21T07:55:00', paymentMethod: 'Credit Card' },
  { id: 'ORD-10425', customer: users[4], items: [{ product: products[8], qty: 2 }, { product: products[10], qty: 1 }], total: 164.97, discount: 'NEWUSER15', discountAmount: 24.74, status: 'Shipped', date: '2026-02-20T22:30:00', paymentMethod: 'PayPal' },
  { id: 'ORD-10426', customer: users[5], items: [{ product: products[4], qty: 1 }, { product: products[9], qty: 1 }], total: 149.98, discount: null, discountAmount: 0, status: 'Delivered', date: '2026-02-20T18:12:00', paymentMethod: 'Credit Card' },
  { id: 'ORD-10427', customer: users[6], items: [{ product: products[7], qty: 1 }], total: 39.99, discount: null, discountAmount: 0, status: 'Cancelled', date: '2026-02-20T15:45:00', paymentMethod: 'UPI' },
  { id: 'ORD-10428', customer: users[7], items: [{ product: products[0], qty: 2 }, { product: products[1], qty: 1 }], total: 389.97, discount: 'SAVE10', discountAmount: 38.99, status: 'Delivered', date: '2026-02-20T12:20:00', paymentMethod: 'Credit Card' },
  { id: 'ORD-10429', customer: users[0], items: [{ product: products[5], qty: 2 }], total: 239.98, discount: null, discountAmount: 0, status: 'Processing', date: '2026-02-20T09:00:00', paymentMethod: 'Debit Card' },
  { id: 'ORD-10430', customer: users[3], items: [{ product: products[2], qty: 1 }, { product: products[8], qty: 1 }], total: 259.98, discount: 'FLOW20', discountAmount: 51.99, status: 'Shipped', date: '2026-02-19T21:30:00', paymentMethod: 'PayPal' },
  { id: 'ORD-10431', customer: users[1], items: [{ product: products[10], qty: 2 }], total: 89.98, discount: null, discountAmount: 0, status: 'Delivered', date: '2026-02-19T16:45:00', paymentMethod: 'UPI' },
  { id: 'ORD-10432', customer: users[6], items: [{ product: products[3], qty: 3 }, { product: products[9], qty: 1 }], total: 219.96, discount: 'NEWUSER15', discountAmount: 32.99, status: 'Placed', date: '2026-02-19T11:15:00', paymentMethod: 'Credit Card' },
];

// ========== Notifications ==========
export const notifications = [
  { id: 'NTF-001', type: 'Email', title: 'Order Confirmation Sent', message: 'Confirmation email sent to alex@orderflow.io for ORD-10421', orderId: 'ORD-10421', timestamp: '2026-02-21T09:15:30', read: true },
  { id: 'NTF-002', type: 'SMS', title: 'Shipping Update', message: 'SMS alert sent to Priya Sharma — order ORD-10422 shipped via FedEx', orderId: 'ORD-10422', timestamp: '2026-02-21T08:43:00', read: true },
  { id: 'NTF-003', type: 'System', title: 'Low Stock Alert', message: 'Smart Fitness Watch (SFW-300) stock dropped below threshold: 12 units remaining', orderId: null, timestamp: '2026-02-21T08:10:05', read: false },
  { id: 'NTF-004', type: 'Email', title: 'Discount Applied', message: 'FLOW20 discount code applied to ORD-10423 — saved $41.99', orderId: 'ORD-10423', timestamp: '2026-02-21T08:10:02', read: false },
  { id: 'NTF-005', type: 'System', title: 'New Order Received', message: 'Order ORD-10424 placed by Sofia Gomez — $169.99', orderId: 'ORD-10424', timestamp: '2026-02-21T07:55:00', read: false },
  { id: 'NTF-006', type: 'SMS', title: 'Delivery Confirmed', message: 'SMS delivery confirmation sent to Emma Wilson for ORD-10426', orderId: 'ORD-10426', timestamp: '2026-02-20T18:15:00', read: true },
  { id: 'NTF-007', type: 'System', title: 'Order Cancelled', message: 'ORD-10427 cancelled by Raj Patel — inventory restocked automatically', orderId: 'ORD-10427', timestamp: '2026-02-20T15:46:00', read: true },
  { id: 'NTF-008', type: 'Email', title: 'Order Confirmation Sent', message: 'Confirmation email sent to mia@orderflow.io for ORD-10428', orderId: 'ORD-10428', timestamp: '2026-02-20T12:20:30', read: true },
  { id: 'NTF-009', type: 'System', title: 'Critical: Out of Stock', message: 'Mechanical Mouse (MMO-012) is now out of stock — 0 units', orderId: null, timestamp: '2026-02-20T10:00:00', read: false },
  { id: 'NTF-010', type: 'Email', title: 'Shipping Notification', message: 'Shipping notification sent to alex@orderflow.io for ORD-10429', orderId: 'ORD-10429', timestamp: '2026-02-20T09:05:00', read: true },
  { id: 'NTF-011', type: 'SMS', title: 'Order Placed Alert', message: 'SMS confirmation sent to Sofia Gomez for ORD-10430', orderId: 'ORD-10430', timestamp: '2026-02-19T21:31:00', read: true },
  { id: 'NTF-012', type: 'System', title: 'Rate Limit Triggered', message: 'API rate limit reached for IP 192.168.1.45 — Redis throttle activated', orderId: null, timestamp: '2026-02-19T19:00:00', read: true },
];

// ========== Chart Data ==========
export const ordersChartData = [
  { day: 'Feb 15', orders: 18, revenue: 2840 },
  { day: 'Feb 16', orders: 24, revenue: 3920 },
  { day: 'Feb 17', orders: 21, revenue: 3150 },
  { day: 'Feb 18', orders: 32, revenue: 5280 },
  { day: 'Feb 19', orders: 28, revenue: 4560 },
  { day: 'Feb 20', orders: 35, revenue: 5890 },
  { day: 'Feb 21', orders: 22, revenue: 3640 },
];

export const revenueByCategory = [
  { name: 'Electronics', value: 12450, color: '#3b82f6' },
  { name: 'Wearables', value: 4800, color: '#8b5cf6' },
  { name: 'Accessories', value: 6320, color: '#06b6d4' },
  { name: 'Storage', value: 3200, color: '#10b981' },
];

// ========== Services ==========
export const services = [
  {
    name: 'Order Service',
    tech: 'Go + Gin',
    status: 'Healthy',
    uptime: '99.97%',
    latency: '12ms',
    port: 8081,
    description: 'Handles order placement, validation, and lifecycle management',
    endpoints: 14,
    requestsPerMin: 342,
  },
  {
    name: 'Inventory Service',
    tech: 'Go + Gin',
    status: 'Healthy',
    uptime: '99.95%',
    latency: '8ms',
    port: 8082,
    description: 'Manages product catalog, stock levels, and inventory reservations',
    endpoints: 11,
    requestsPerMin: 528,
  },
  {
    name: 'Notification Service',
    tech: 'Go + Gin',
    status: 'Healthy',
    uptime: '99.92%',
    latency: '24ms',
    port: 8083,
    description: 'Consumes Kafka events to trigger email/SMS alerts',
    endpoints: 6,
    requestsPerMin: 189,
  },
];

export const redisStats = {
  status: 'Connected',
  hitRate: '94.2%',
  totalKeys: 1247,
  memoryUsed: '128 MB',
  maxMemory: '512 MB',
  evictionPolicy: 'allkeys-lru',
  connectedClients: 12,
  opsPerSec: 1580,
};

export const kafkaStats = {
  status: 'Running',
  brokers: 3,
  topics: ['order-events', 'inventory-updates', 'notification-triggers'],
  messagesPerSec: 245,
  consumerGroups: 3,
  consumerLag: 12,
  partitions: 9,
  replicationFactor: 2,
};

export const dbStats = {
  status: 'Connected',
  type: 'PostgreSQL 16',
  tables: 8,
  indexes: 14,
  activeConnections: 24,
  maxConnections: 100,
  dbSize: '2.4 GB',
  avgQueryTime: '3.2ms',
};

// ========== Dashboard Stats ==========
export const dashboardStats = {
  totalOrders: 1247,
  revenue: 187420,
  activeProducts: 12,
  pendingAlerts: 4,
  ordersChange: 12.5,
  revenueChange: 8.3,
  productsChange: 2,
  alertsChange: -15,
};
