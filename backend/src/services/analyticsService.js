import { memoryStore } from './store.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const analyticsService = {
  async getDashboardOverview() {
    const today = new Date().toISOString().slice(0, 10);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: todayOrders, error } = await supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)')
          .or(`service_date.eq.${today},created_at.gte.${today}T00:00:00Z`);

        const { data: settings } = await supabaseAdmin
          .from('canteen_settings')
          .select('canteen_open')
          .eq('id', 1)
          .maybeSingle();

        if (!error && todayOrders) {
          const validOrders = todayOrders.filter(o => o.order_status !== 'Cancelled');
          const totalSalesToday = validOrders
            .filter(o => o.payment_status === 'Paid')
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

          const pendingCount = todayOrders.filter(o => o.order_status === 'Placed').length;
          const preparingCount = todayOrders.filter(o => o.order_status === 'Preparing').length;
          const readyCount = todayOrders.filter(o => o.order_status === 'Ready').length;
          const collectedCount = todayOrders.filter(o => o.order_status === 'Collected').length;
          const cancelledCount = todayOrders.filter(o => o.order_status === 'Cancelled').length;

          const itemCounts = {};
          for (const ord of validOrders) {
            const items = ord.items || [];
            for (const it of items) {
              const name = it.item_name_snapshot || 'Item';
              itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 1);
            }
          }

          const popularItems = Object.entries(itemCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          const hourlyDistribution = Array.from({ length: 8 }, (_, i) => ({
            hour: `${9 + i}:00`,
            orders: 0,
            sales: 0
          }));

          for (const ord of validOrders) {
            if (ord.created_at) {
              const h = new Date(ord.created_at).getHours();
              const slotIdx = h - 9;
              if (slotIdx >= 0 && slotIdx < hourlyDistribution.length) {
                hourlyDistribution[slotIdx].orders += 1;
                if (ord.payment_status === 'Paid') {
                  hourlyDistribution[slotIdx].sales += Number(ord.total) || 0;
                }
              }
            }
          }

          return {
            canteen_open: settings ? settings.canteen_open : memoryStore.settings.canteen_open,
            today_orders_count: todayOrders.length,
            today_sales: totalSalesToday,
            status_breakdown: {
              placed: pendingCount,
              preparing: preparingCount,
              ready: readyCount,
              collected: collectedCount,
              cancelled: cancelledCount
            },
            popular_items: popularItems,
            hourly_trends: hourlyDistribution,
            recent_orders: todayOrders.slice(0, 5)
          };
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    // MemoryStore fallback
    const orders = Array.from(memoryStore.orders.values());
    const todayOrders = orders.filter(o => o.service_date === today || (o.created_at && o.created_at.slice(0, 10) === today));

    const validOrders = todayOrders.filter(o => o.order_status !== 'Cancelled');
    const totalSalesToday = validOrders
      .filter(o => o.payment_status === 'Paid')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const pendingCount = todayOrders.filter(o => o.order_status === 'Placed').length;
    const preparingCount = todayOrders.filter(o => o.order_status === 'Preparing').length;
    const readyCount = todayOrders.filter(o => o.order_status === 'Ready').length;
    const collectedCount = todayOrders.filter(o => o.order_status === 'Collected').length;
    const cancelledCount = todayOrders.filter(o => o.order_status === 'Cancelled').length;

    const itemCounts = {};
    for (const ord of validOrders) {
      const items = memoryStore.orderItems.get(ord.id) || [];
      for (const it of items) {
        itemCounts[it.item_name_snapshot] = (itemCounts[it.item_name_snapshot] || 0) + it.quantity;
      }
    }

    const popularItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const hourlyDistribution = Array.from({ length: 8 }, (_, i) => ({
      hour: `${9 + i}:00`,
      orders: 0,
      sales: 0
    }));

    for (const ord of validOrders) {
      if (ord.created_at) {
        const h = new Date(ord.created_at).getHours();
        const slotIdx = h - 9;
        if (slotIdx >= 0 && slotIdx < hourlyDistribution.length) {
          hourlyDistribution[slotIdx].orders += 1;
          if (ord.payment_status === 'Paid') {
            hourlyDistribution[slotIdx].sales += Number(ord.total) || 0;
          }
        }
      }
    }

    return {
      canteen_open: memoryStore.settings.canteen_open,
      today_orders_count: todayOrders.length,
      today_sales: totalSalesToday,
      status_breakdown: {
        placed: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
        collected: collectedCount,
        cancelled: cancelledCount
      },
      popular_items: popularItems,
      hourly_trends: hourlyDistribution,
      recent_orders: todayOrders.slice(0, 5)
    };
  }
};
