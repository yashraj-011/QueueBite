import { memoryStore } from './store.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const orderService = {
  async placeOrder({ userId, pickupSlotId, paymentMethod, note, items }) {
    if (!userId) throw new Error('User ID is required');
    if (!pickupSlotId) throw new Error('Pickup slot is required');
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order items must be a non-empty array');
    }

    // 1. If Supabase is fully configured, execute atomic PostgreSQL stored procedure
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.rpc('fn_place_order_atomic', {
          p_user_id: userId,
          p_pickup_slot_id: pickupSlotId,
          p_payment_method: paymentMethod || 'UPI',
          p_note: note || '',
          p_items: items
        });

        if (error) {
          const err = new Error(error.message);
          err.status = 400;
          throw err;
        }

        if (data) {
          const { data: fullOrder } = await supabaseAdmin
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('id', data.order_id)
            .maybeSingle();

          return {
            ...data,
            order: fullOrder || data
          };
        }
      } catch (err) {
        if (err.status) throw err;
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    // 2. Atomic execution via memory store fallback
    if (!memoryStore.settings.canteen_open) {
      const err = new Error('Canteen is currently closed for new orders.');
      err.status = 400;
      throw err;
    }

    const user = memoryStore.profiles.get(userId);
    if (!user) {
      const err = new Error('User profile not found.');
      err.status = 404;
      throw err;
    }

    const slot = memoryStore.slots.get(pickupSlotId);
    if (!slot) {
      const err = new Error('Pickup slot not found.');
      err.status = 404;
      throw err;
    }

    if (slot.is_blocked) {
      const err = new Error('This pickup slot has been blocked by canteen staff.');
      err.status = 400;
      throw err;
    }

    if (slot.booked_count >= slot.max_orders) {
      const err = new Error('This pickup slot is fully booked. Please select another slot.');
      err.status = 400;
      throw err;
    }

    // Check past slot
    const today = new Date().toISOString().slice(0, 10);
    if (slot.slot_date < today) {
      const err = new Error('Cannot book a past date slot.');
      err.status = 400;
      throw err;
    }

    // Calculate total & validate inventory
    let calculatedTotal = 0;
    const orderItemsSnapshots = [];

    for (const item of items) {
      const qty = parseInt(item.quantity || item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        const err = new Error('Invalid item quantity.');
        err.status = 400;
        throw err;
      }

      const menuItem = memoryStore.menu.get(item.menu_item_id || item.id);
      if (!menuItem) {
        const err = new Error(`Menu item not found: ${item.menu_item_id || item.id}`);
        err.status = 404;
        throw err;
      }

      if (!menuItem.is_available) {
        const err = new Error(`${menuItem.name} is currently unavailable.`);
        err.status = 400;
        throw err;
      }

      if (menuItem.stock !== null && menuItem.stock !== undefined) {
        if (menuItem.stock < qty) {
          const err = new Error(`Insufficient stock for ${menuItem.name}. Remaining: ${menuItem.stock}`);
          err.status = 400;
          throw err;
        }
      }

      const lineTotal = menuItem.price * qty;
      calculatedTotal += lineTotal;

      orderItemsSnapshots.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        menu_item_id: menuItem.id,
        item_name_snapshot: menuItem.name,
        quantity: qty,
        unit_price_snapshot: menuItem.price,
        line_total: lineTotal
      });
    }

    // Deduct stock
    for (const snap of orderItemsSnapshots) {
      const menuItem = memoryStore.menu.get(snap.menu_item_id);
      if (menuItem && menuItem.stock !== null && menuItem.stock !== undefined) {
        menuItem.stock -= snap.quantity;
        if (menuItem.stock <= 0) {
          menuItem.stock = 0;
          menuItem.is_available = false;
        }
      }
    }

    // Increment slot reservation
    slot.booked_count += 1;

    // Allocate sequential token
    const token = memoryStore.getNextDailyToken(slot.slot_date);
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const slotTimeSnapshot = `${slot.start_time} - ${slot.end_time}`;
    const paymentStatus = paymentMethod === 'UPI' ? 'Paid' : 'Pending';

    const orderRecord = {
      id: orderId,
      token,
      service_date: slot.slot_date,
      user_id: user.id,
      student_name_snapshot: user.name,
      college_id_snapshot: user.college_id,
      phone_snapshot: user.phone || '',
      pickup_slot_id: slot.id,
      slot_time_snapshot: slotTimeSnapshot,
      total: calculatedTotal,
      order_status: 'Placed',
      payment_status: paymentStatus,
      payment_method: paymentMethod || 'UPI',
      note: note || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryStore.orders.set(orderId, orderRecord);
    memoryStore.orderItems.set(orderId, orderItemsSnapshots);

    return {
      success: true,
      order_id: orderId,
      token,
      total: calculatedTotal,
      status: 'Placed',
      payment_status: paymentStatus,
      slot_time: slotTimeSnapshot,
      order: {
        ...orderRecord,
        items: orderItemsSnapshots
      }
    };
  },

  async getOrders({ status, date, userId, search, limit = 50, offset = 0 } = {}) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)', { count: 'exact' });

        if (userId) query = query.eq('user_id', userId);
        if (status) query = query.ilike('order_status', status);
        if (date) query = query.eq('service_date', date);
        if (search) {
          const q = search.trim();
          query = query.or(`token.ilike.%${q}%,student_name_snapshot.ilike.%${q}%,college_id_snapshot.ilike.%${q}%`);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          return {
            total: count || data.length,
            orders: data
          };
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    let list = Array.from(memoryStore.orders.values());

    if (userId) {
      list = list.filter(o => o.user_id === userId);
    }
    if (status) {
      list = list.filter(o => o.order_status.toLowerCase() === status.toLowerCase());
    }
    if (date) {
      list = list.filter(o => o.service_date === date);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => 
        o.token.toLowerCase().includes(q) ||
        o.student_name_snapshot.toLowerCase().includes(q) ||
        o.college_id_snapshot.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = list.slice(offset, offset + limit).map(o => ({
      ...o,
      items: memoryStore.orderItems.get(o.id) || []
    }));

    return {
      total: list.length,
      orders: enriched
    };
  },

  async getOrderById(orderId, requester = null) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: order, error } = await supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (!error && order) {
          if (requester && requester.role === 'student' && order.user_id !== requester.id) {
            const err = new Error('Access denied to other student orders');
            err.status = 403;
            throw err;
          }
          return order;
        }
      } catch (err) {
        if (err.status === 403) throw err;
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const order = memoryStore.orders.get(orderId);
    if (!order) return null;

    if (requester && requester.role === 'student' && order.user_id !== requester.id) {
      const err = new Error('Access denied to other student orders');
      err.status = 403;
      throw err;
    }

    return {
      ...order,
      items: memoryStore.orderItems.get(order.id) || []
    };
  },

  async getOrderByToken(tokenQuery) {
    const q = tokenQuery.replace('#', '').trim().toLowerCase();

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const formatted = `#${q.padStart(3, '0')}`;
        const { data: order, error } = await supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('token', formatted)
          .maybeSingle();

        if (!error && order) return order;
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    for (const order of memoryStore.orders.values()) {
      const ordToken = order.token.replace('#', '').trim().toLowerCase();
      if (ordToken === q || ordToken.replace(/^0+/, '') === q.replace(/^0+/, '')) {
        return {
          ...order,
          items: memoryStore.orderItems.get(order.id) || []
        };
      }
    }
    return null;
  },

  async updateStatus(orderId, newStatus, userRole = 'staff') {
    const validNext = {
      Placed: 'Preparing',
      Preparing: 'Ready',
      Ready: 'Collected'
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: currentOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (currentOrder) {
          const current = currentOrder.order_status;
          if (current === 'Collected' || current === 'Cancelled' || current === 'Missed') {
            const err = new Error(`Cannot change status of a terminal order (${current})`);
            err.status = 400;
            throw err;
          }

          if (validNext[current] !== newStatus) {
            const err = new Error(`Invalid status transition from ${current} to ${newStatus}. Expected: ${validNext[current] || 'Terminal'}`);
            err.status = 400;
            throw err;
          }

          const { data: updated, error } = await supabaseAdmin
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId)
            .select('*, items:order_items(*)')
            .single();

          if (!error && updated) return updated;
        }
      } catch (err) {
        if (err.status === 400 || err.status === 404) throw err;
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const order = memoryStore.orders.get(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    const current = order.order_status;
    if (current === 'Collected' || current === 'Cancelled' || current === 'Missed') {
      const err = new Error(`Cannot change status of a terminal order (${current})`);
      err.status = 400;
      throw err;
    }

    if (validNext[current] !== newStatus) {
      const err = new Error(`Invalid status transition from ${current} to ${newStatus}. Expected: ${validNext[current] || 'Terminal'}`);
      err.status = 400;
      throw err;
    }

    order.order_status = newStatus;
    order.updated_at = new Date().toISOString();

    return {
      ...order,
      items: memoryStore.orderItems.get(order.id) || []
    };
  },

  async cancelOrder(orderId, { reason, cancelledBy, userRole, userId }) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.rpc('fn_cancel_order_atomic', {
          p_order_id: orderId,
          p_user_id: userId,
          p_role: userRole || 'student',
          p_reason: reason || 'Cancellation'
        });

        if (error) {
          const err = new Error(error.message);
          err.status = 400;
          throw err;
        }

        if (data) {
          const { data: updated } = await supabaseAdmin
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('id', orderId)
            .maybeSingle();
          return updated || data;
        }
      } catch (err) {
        if (err.status) throw err;
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const order = memoryStore.orders.get(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    if (order.order_status === 'Collected' || order.order_status === 'Cancelled' || order.order_status === 'Missed') {
      const err = new Error(`Order is already in terminal state: ${order.order_status}`);
      err.status = 400;
      throw err;
    }

    if (userRole === 'student') {
      if (order.user_id !== userId) {
        const err = new Error('Unauthorized to cancel this order.');
        err.status = 403;
        throw err;
      }
      if (order.order_status !== 'Placed') {
        const err = new Error('Students can only cancel orders in Placed status.');
        err.status = 400;
        throw err;
      }
    }

    // Restore stock
    const items = memoryStore.orderItems.get(orderId) || [];
    for (const it of items) {
      const menuItem = memoryStore.menu.get(it.menu_item_id);
      if (menuItem && menuItem.stock !== null && menuItem.stock !== undefined) {
        menuItem.stock += it.quantity;
        menuItem.is_available = true;
      }
    }

    // Decrement slot booked count
    if (order.pickup_slot_id) {
      const slot = memoryStore.slots.get(order.pickup_slot_id);
      if (slot && slot.booked_count > 0) {
        slot.booked_count -= 1;
      }
    }

    order.order_status = 'Cancelled';
    if (order.payment_status === 'Paid') {
      order.payment_status = 'Refunded';
    }
    order.cancelled_by = cancelledBy || userRole || 'system';
    order.cancel_reason = reason || 'User cancellation';
    order.updated_at = new Date().toISOString();

    return {
      ...order,
      items
    };
  },

  async markPaid(orderId) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: current } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (current) {
          if (current.order_status === 'Cancelled' || current.order_status === 'Missed') {
            const err = new Error(`Cannot mark payment for a ${current.order_status} order`);
            err.status = 400;
            throw err;
          }

          if (current.payment_status !== 'Pending') {
            const err = new Error(`Order is already marked as ${current.payment_status}`);
            err.status = 400;
            throw err;
          }

          const { data: updated, error } = await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'Paid' })
            .eq('id', orderId)
            .select()
            .single();

          if (!error && updated) return updated;
        }
      } catch (err) {
        if (err.status === 400) throw err;
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const order = memoryStore.orders.get(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }

    if (order.order_status === 'Cancelled' || order.order_status === 'Missed') {
      const err = new Error(`Cannot mark payment for a ${order.order_status} order`);
      err.status = 400;
      throw err;
    }

    if (order.payment_status !== 'Pending') {
      const err = new Error(`Order is already marked as ${order.payment_status}`);
      err.status = 400;
      throw err;
    }

    order.payment_status = 'Paid';
    order.updated_at = new Date().toISOString();
    return order;
  }
};
