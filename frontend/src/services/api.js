const API_BASE = (import.meta.env.VITE_API_BASE || '/api/v1').replace(/\/+$/, '');

class ApiService {
  constructor() {
    this.token = localStorage.getItem('qb_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('qb_token', token);
    } else {
      localStorage.removeItem('qb_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Auth API
  async login(credentials) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getSession() {
    return this.request('/auth/session');
  }

  async logout() {
    this.setToken(null);
    return this.request('/auth/logout', { method: 'POST' }).catch(() => ({}));
  }

  // Menu API
  async getMenu(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/menu${query ? `?${query}` : ''}`);
  }

  async getCategories() {
    return this.request('/menu/categories');
  }

  async createMenuItem(itemData) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateMenuItem(id, updates) {
    return this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async updateItemAvailability(id, isAvailable) {
    return this.request(`/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: isAvailable })
    });
  }

  async updateItemStock(id, stock) {
    return this.request(`/menu/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock })
    });
  }

  async deleteMenuItem(id) {
    return this.request(`/menu/${id}`, { method: 'DELETE' });
  }

  async uploadMenuImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${API_BASE}/menu/upload-image`, {
      method: 'POST',
      headers,
      body: formData   // no Content-Type — browser sets multipart boundary automatically
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `Upload failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data; // { success: true, url: '...' }
  }

  // Slots API
  async getSlots(date = null) {
    return this.request(`/slots${date ? `?date=${date}` : ''}`);
  }

  async getAvailableSlots(date = null) {
    return this.request(`/slots/available${date ? `?date=${date}` : ''}`);
  }

  async getSlotSettings() {
    return this.request('/slots/settings');
  }

  async updateSlotSettings(settings) {
    return this.request('/slots/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  async updateSlotCapacity(id, capacity) {
    return this.request(`/slots/${id}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify({ capacity })
    });
  }

  async toggleSlotBlock(id, blocked = null) {
    return this.request(`/slots/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked })
    });
  }

  async bulkBlockSlots(date) {
    return this.request('/slots/bulk-block', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  async bulkUnblockSlots(date) {
    return this.request('/slots/bulk-unblock', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  // Orders API
  async placeOrder(orderPayload) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  }

  async getMyOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders/my-orders${query ? `?${query}` : ''}`);
  }

  async getAllOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async getOrderByToken(token) {
    return this.request(`/orders/token/${encodeURIComponent(token)}`);
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async cancelOrder(id, reason = '') {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async markOrderPaid(id) {
    return this.request(`/orders/${id}/payment`, {
      method: 'PATCH'
    });
  }

  // Canteen API
  async getCanteenStatus() {
    return this.request('/canteen/status');
  }

  async setCanteenStatus(open) {
    return this.request('/canteen/status', {
      method: 'POST',
      body: JSON.stringify({ open })
    });
  }

  // Admin Analytics
  async getAnalyticsOverview() {
    return this.request('/admin/analytics/overview');
  }
}

export const api = new ApiService();
