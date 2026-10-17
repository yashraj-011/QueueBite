import { memoryStore } from './store.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const toLocalDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const slotService = {
  async getSlots(targetDate = null) {
    const d = targetDate || toLocalDate();

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        // 1. Fetch slots for date
        let { data: slots, error } = await supabaseAdmin
          .from('pickup_slots')
          .select('*')
          .eq('slot_date', d)
          .order('start_time', { ascending: true });

        // If no slots exist for this date, auto-generate standard interval slots
        if (!error && (!slots || slots.length === 0)) {
          const settings = await this.getSettings();
          const startMins = 9 * 60; // 09:00
          const endMins = 16 * 60;  // 16:00
          const duration = settings.slot_duration_minutes || 10;
          const defaultCap = settings.default_slot_capacity || 8;
          const generated = [];

          for (let m = startMins; m < endMins; m += duration) {
            const sh = String(Math.floor(m / 60)).padStart(2, '0');
            const sm = String(m % 60).padStart(2, '0');
            const eh = String(Math.floor((m + duration) / 60)).padStart(2, '0');
            const em = String((m + duration) % 60).padStart(2, '0');
            const sTime = `${sh}:${sm}`;
            const eTime = `${eh}:${em}`;

            // Check if slot falls in a canteen break
            const isBreak = settings.breaks?.some(b => sTime >= b.start_time && eTime <= b.end_time);

            generated.push({
              slot_date: d,
              start_time: sTime,
              end_time: eTime,
              max_orders: defaultCap,
              booked_count: 0,
              is_blocked: Boolean(isBreak)
            });
          }

          if (generated.length > 0) {
            const insertRes = await supabaseAdmin.from('pickup_slots').insert(generated).select();
            if (!insertRes.error && insertRes.data) {
              slots = insertRes.data;
            }
          }
        }

        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
        } else if (slots && slots.length > 0) {
          return slots;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    // MemoryStore fallback
    memoryStore.generateDefaultSlotsForDate(d);
    const slots = Array.from(memoryStore.slots.values()).filter(s => s.slot_date === d);
    return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  async getAvailableSlots(targetDate = null) {
    const slots = await this.getSlots(targetDate);
    const today = toLocalDate();
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let available = slots.filter(s => {
      if (s.is_blocked) return false;
      if (s.booked_count >= s.max_orders) return false;

      // Filter past slots for today
      if (s.slot_date === today) {
        const [eh, em] = s.end_time.split(':').map(Number);
        if (eh * 60 + em <= currentMins) return false;
      }
      return true;
    });

    if (!targetDate && available.length === 0) {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = toLocalDate(tomorrowDate);
      const tomorrowSlots = await this.getSlots(tomorrow);
      available = tomorrowSlots.filter(s => !s.is_blocked && s.booked_count < s.max_orders);
    }

    return available.map(s => ({
      ...s,
      remaining: Math.max(0, s.max_orders - s.booked_count),
      is_available: s.booked_count < s.max_orders
    }));
  },

  async updateCapacity(slotId, newCapacity) {
    const cap = parseInt(newCapacity, 10);
    if (isNaN(cap) || cap < 1) {
      const err = new Error('Capacity must be at least 1');
      err.status = 400;
      throw err;
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: slot, error: fetchErr } = await supabaseAdmin
          .from('pickup_slots')
          .select('*')
          .eq('id', slotId)
          .maybeSingle();

        if (!fetchErr && slot) {
          if (cap < slot.booked_count) {
            const err = new Error(`Capacity cannot be lower than existing bookings (${slot.booked_count})`);
            err.status = 400;
            throw err;
          }

          const { data: updated, error: updateErr } = await supabaseAdmin
            .from('pickup_slots')
            .update({ max_orders: cap })
            .eq('id', slotId)
            .select()
            .single();

          if (!updateErr && updated) return updated;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const slot = memoryStore.slots.get(slotId);
    if (!slot) {
      const err = new Error('Slot not found');
      err.status = 404;
      throw err;
    }
    if (cap < slot.booked_count) {
      const err = new Error(`Capacity cannot be lower than existing bookings (${slot.booked_count})`);
      err.status = 400;
      throw err;
    }
    slot.max_orders = cap;
    return slot;
  },

  async toggleBlock(slotId, isBlocked = null) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: slot, error: fetchErr } = await supabaseAdmin
          .from('pickup_slots')
          .select('*')
          .eq('id', slotId)
          .maybeSingle();

        if (!fetchErr && slot) {
          const newBlock = isBlocked !== null ? Boolean(isBlocked) : !slot.is_blocked;
          const { data: updated, error: updateErr } = await supabaseAdmin
            .from('pickup_slots')
            .update({ is_blocked: newBlock })
            .eq('id', slotId)
            .select()
            .single();

          if (!updateErr && updated) return updated;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const slot = memoryStore.slots.get(slotId);
    if (!slot) {
      const err = new Error('Slot not found');
      err.status = 404;
      throw err;
    }
    slot.is_blocked = isBlocked !== null ? Boolean(isBlocked) : !slot.is_blocked;
    return slot;
  },

  async bulkBlock(date) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('pickup_slots')
          .update({ is_blocked: true })
          .eq('slot_date', date)
          .select();
        if (!error && data) {
          return { count: data.length, slots: data };
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const slots = await this.getSlots(date);
    let count = 0;
    for (const slot of slots) {
      if (!slot.is_blocked) {
        slot.is_blocked = true;
        count++;
      }
    }
    return { count, slots };
  },

  async bulkUnblock(date) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('pickup_slots')
          .update({ is_blocked: false })
          .eq('slot_date', date)
          .select();
        if (!error && data) {
          return { count: data.length, slots: data };
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const slots = await this.getSlots(date);
    let count = 0;
    for (const slot of slots) {
      if (slot.is_blocked) {
        slot.is_blocked = false;
        count++;
      }
    }
    return { count, slots };
  },

  async getSettings() {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: settings } = await supabaseAdmin
          .from('canteen_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        const { data: breaks } = await supabaseAdmin
          .from('canteen_breaks')
          .select('*')
          .order('start_time', { ascending: true });

        if (settings) {
          return {
            ...settings,
            breaks: breaks || []
          };
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    return {
      ...memoryStore.settings,
      breaks: memoryStore.breaks
    };
  },

  async updateSettings(updates) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload = {};
        if (updates.canteen_open !== undefined) payload.canteen_open = Boolean(updates.canteen_open);
        if (updates.opening_time) payload.opening_time = updates.opening_time;
        if (updates.closing_time) payload.closing_time = updates.closing_time;
        if (updates.slot_duration_minutes) payload.slot_duration_minutes = parseInt(updates.slot_duration_minutes, 10);
        if (updates.default_slot_capacity) payload.default_slot_capacity = parseInt(updates.default_slot_capacity, 10);

        const { data, error } = await supabaseAdmin
          .from('canteen_settings')
          .update(payload)
          .eq('id', 1)
          .select()
          .maybeSingle();

        if (!error && data) {
          return this.getSettings();
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    if (updates.canteen_open !== undefined) memoryStore.settings.canteen_open = Boolean(updates.canteen_open);
    if (updates.opening_time) memoryStore.settings.opening_time = updates.opening_time;
    if (updates.closing_time) memoryStore.settings.closing_time = updates.closing_time;
    if (updates.slot_duration_minutes) memoryStore.settings.slot_duration_minutes = parseInt(updates.slot_duration_minutes, 10);
    if (updates.default_slot_capacity) memoryStore.settings.default_slot_capacity = parseInt(updates.default_slot_capacity, 10);
    memoryStore.settings.updated_at = new Date().toISOString();
    return this.getSettings();
  }
};
