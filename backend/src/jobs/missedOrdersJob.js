import { memoryStore } from '../services/store.js';

export function sweepMissedOrders() {
  const gracePeriodMinutes = memoryStore.settings.collection_grace_period_minutes || 30;
  const now = new Date();
  let markedCount = 0;

  for (const order of memoryStore.orders.values()) {
    if (order.order_status === 'Ready') {
      const updatedAt = new Date(order.updated_at || order.created_at);
      const diffMinutes = (now - updatedAt) / (1000 * 60);

      if (diffMinutes > gracePeriodMinutes) {
        order.order_status = 'Missed';
        order.updated_at = now.toISOString();
        markedCount++;
      }
    }
  }

  if (markedCount > 0) {
    console.log(`[Scheduled Job] Swept and marked ${markedCount} uncollected orders as 'Missed'.`);
  }
}
