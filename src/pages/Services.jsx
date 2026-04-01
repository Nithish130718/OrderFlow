import { Bell, Package, ShoppingCart, UserRoundCog } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import './Services.css';

export default function Services() {
  const { orders, products, notifications, profile } = useAppContext();

  const cards = [
    {
      title: 'Order Help',
      icon: ShoppingCart,
      description: `${orders.length} live orders are available right now. Use Orders to place a new order with confirmation before it is written to the database.`,
    },
    {
      title: 'Inventory Help',
      icon: Package,
      description: `${products.length} products are being tracked. Inventory cards now show thresholds, last update date, and delete actions with confirmation.`,
    },
    {
      title: 'Notification Help',
      icon: Bell,
      description: `${notifications.length} stored notifications can be reviewed from the bell or the Notifications page, including unread and historical alerts.`,
    },
    {
      title: 'Profile Help',
      icon: UserRoundCog,
      description: `${profile?.emergency_contacts?.length || 0} emergency contact emails are configured for critical alert delivery.`,
    },
  ];

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Help</h1>
        <p>Quick guidance for the live workflows currently connected to your OrderFlow database.</p>
      </div>

      <div className="grid-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="glass-card services-page__service-card animate-fade-in-up"
              style={{ animationDelay: `${0.08 * (index + 1)}s` }}
            >
              <div className="services-page__card-header">
                <div className="services-page__infra-icon services-page__infra-icon--kafka">
                  <Icon size={20} />
                </div>
                <h4>{card.title}</h4>
              </div>
              <p className="services-page__card-desc">{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
