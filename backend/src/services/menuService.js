import { memoryStore } from './store.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const menuService = {
  async getMenu({ category, search, dietary, isVisible = true } = {}) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('menu_items').select('*');

        if (isVisible !== undefined) {
          query = query.eq('is_visible', isVisible);
        }
        if (category && category !== 'All') {
          query = query.ilike('category', category);
        }
        if (dietary && dietary !== 'all') {
          query = query.eq('dietary_classification', dietary);
        }
        if (search) {
          const q = search.trim();
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
          // Fallback if table not yet migrated in test/dev
          console.warn('[menuService] Supabase query failed, using memory store fallback:', error.message);
        } else {
          return data || [];
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    // MemoryStore fallback
    let items = Array.from(memoryStore.menu.values());

    if (isVisible !== undefined) {
      items = items.filter(i => i.is_visible === isVisible);
    }
    if (category && category !== 'All') {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (dietary && dietary !== 'all') {
      items = items.filter(i => i.dietary_classification === dietary);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return items;
  },

  async getItemById(id) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
        } else if (data) {
          return data;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }
    return memoryStore.menu.get(id) || null;
  },

  async createItem(itemData) {
    const newItemPayload = {
      name: itemData.name,
      category: itemData.category || 'Snacks',
      price: parseFloat(itemData.price) || 0,
      description: itemData.description || '',
      image_url: itemData.image_url || itemData.imageUrl || '',
      preparation_minutes: parseInt(itemData.preparation_minutes || itemData.prepTime, 10) || 5,
      dietary_classification: itemData.dietary_classification || (itemData.isVeg ? 'veg' : 'non-veg'),
      tags: Array.isArray(itemData.tags) ? itemData.tags : [],
      stock: itemData.stock !== undefined && itemData.stock !== '' ? parseInt(itemData.stock, 10) : null,
      is_available: itemData.is_available ?? itemData.available ?? true,
      is_visible: itemData.is_visible ?? itemData.visible ?? true
    };

    if (itemData.id) newItemPayload.id = itemData.id;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .insert(newItemPayload)
          .select()
          .single();
        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
          console.warn('[menuService] Supabase insert failed, using memory store fallback:', error.message);
        } else if (data) {
          return data;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const id = itemData.id || `item-${Date.now()}`;
    const newItem = {
      ...newItemPayload,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.menu.set(id, newItem);
    return newItem;
  },

  async updateItem(id, updates) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.price !== undefined) payload.price = parseFloat(updates.price);
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.image_url !== undefined) payload.image_url = updates.image_url;
        if (updates.preparation_minutes !== undefined) payload.preparation_minutes = parseInt(updates.preparation_minutes, 10);
        if (updates.dietary_classification !== undefined) payload.dietary_classification = updates.dietary_classification;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.stock !== undefined) {
          payload.stock = updates.stock === null || updates.stock === '' ? null : parseInt(updates.stock, 10);
          if (payload.stock === 0) payload.is_available = false;
        }
        if (updates.is_available !== undefined) payload.is_available = Boolean(updates.is_available);
        if (updates.is_visible !== undefined) payload.is_visible = Boolean(updates.is_visible);

        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .update(payload)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
        } else if (data) {
          return data;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const item = memoryStore.menu.get(id);
    if (!item) {
      const err = new Error('Menu item not found');
      err.status = 404;
      throw err;
    }

    if (updates.name !== undefined) item.name = updates.name;
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.price !== undefined) item.price = parseFloat(updates.price);
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.image_url !== undefined) item.image_url = updates.image_url;
    if (updates.preparation_minutes !== undefined) item.preparation_minutes = parseInt(updates.preparation_minutes, 10);
    if (updates.dietary_classification !== undefined) item.dietary_classification = updates.dietary_classification;
    if (updates.tags !== undefined) item.tags = updates.tags;
    if (updates.stock !== undefined) {
      item.stock = updates.stock === null || updates.stock === '' ? null : parseInt(updates.stock, 10);
      if (item.stock === 0) item.is_available = false;
    }
    if (updates.is_available !== undefined) item.is_available = Boolean(updates.is_available);
    if (updates.is_visible !== undefined) item.is_visible = Boolean(updates.is_visible);

    item.updated_at = new Date().toISOString();
    return item;
  },

  async deleteItem(id) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
        } else if (data) {
          return data;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    if (!memoryStore.menu.has(id)) {
      const err = new Error('Menu item not found');
      err.status = 404;
      throw err;
    }
    const item = memoryStore.menu.get(id);
    memoryStore.menu.delete(id);
    return item;
  },

  async getCategories() {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .select('category');
        if (error) {
          if (process.env.NODE_ENV === 'production') throw error;
        } else if (data) {
          const categories = new Set(data.map(d => d.category).filter(Boolean));
          return Array.from(categories);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
      }
    }

    const categories = new Set();
    for (const item of memoryStore.menu.values()) {
      if (item.category) categories.add(item.category);
    }
    return Array.from(categories);
  }
};
