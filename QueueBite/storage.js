// ==========================================================================
// QueueBite Data Storage Layer (storage.js)
// --------------------------------------------------------------------------
// Central data access layer for QueueBite (College Canteen Pre-order).
// Handles:
// 1. User sessions & Role-based authentication (Student & Admin)
// 2. Menu management & Stock inventory
// 3. Shopping cart operations
// 4. Time slots configuration & pickup capacity
// 5. Orders fulfillment, status tracking & token generation
//
// NOTE FOR ENGINEERING STUDENTS:
// Functions marked with // BACKEND WILL DO THIS are designed to be replaced
// by Python Flask + SQLite endpoints later. Set USE_BACKEND = true when ready.
// ==========================================================================

// Backend Configuration Flag
const USE_BACKEND = false;
const API_BASE = 'http://localhost:5000/api';

// localStorage Keys (aligned with QUEUEBITE_BRIEF.md & existing admin pages)
const STORAGE_KEYS = {
  USER: 'cubite_current_user',
  SESSION: 'cubite_session',
  CART: 'cubite_cart',
  ORDERS: 'cubite_orders',
  SLOTS: 'cubite_slots',
  SLOTS_CONFIG: 'cubite_slots_config',
  SLOT_SETTINGS: 'cubite_slot_settings',
  MENU: 'cubite_menu',
  CATEGORIES: 'cubite_categories',
  CANTEEN_OPEN: 'cubite_canteen_open',
  TOKEN_COUNTER: 'cubite_token_counter'
};

// ==========================================================================
// SAMPLE INITIAL DATA
// ==========================================================================

// Mapping of known menu items to confirmed offline local images in the images/ folder
const LOCAL_IMAGE_MAP = {
  'Samosa (2 pcs)': 'images/samosa.jpg',
  'Veg Grilled Sandwich': 'images/sandwich.jfif',
  'Masala Dosa': 'images/masaladosa.jfif',
  'Cold Coffee with Ice Cream': 'images/coffee.jfif',
  'Chole Bhature (2 pcs)': 'images/cholebhature.jfif',
  'Masala Maggi with Veggies': 'images/maggi.jfif'
};

const INITIAL_MENU_ITEMS = [
  {
    id: 'item-1',
    name: 'Samosa (2 pcs)',
    category: 'Snacks',
    price: 25,
    prepTime: 5,
    prep: 5,
    description: 'Crispy golden triangular pastries stuffed with spiced potatoes and peas.',
    desc: 'Crispy golden triangular pastries stuffed with spiced potatoes and peas.',
    imageUrl: 'images/samosa.jpg',
    image: 'images/samosa.jpg',
    isVeg: true,
    veg: true,
    tags: ['Bestseller'],
    stock: 35,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-2',
    name: 'Veg Grilled Sandwich',
    category: 'Quick Bites',
    price: 60,
    prepTime: 8,
    prep: 8,
    description: 'Fresh vegetables with green chutney and butter grilled to perfection.',
    desc: 'Fresh vegetables with green chutney and butter grilled to perfection.',
    imageUrl: 'images/sandwich.jfif',
    image: 'images/sandwich.jfif',
    isVeg: true,
    veg: true,
    tags: ['Bestseller', 'Healthy'],
    stock: 20,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-3',
    name: 'Masala Dosa',
    category: 'South Indian',
    price: 70,
    prepTime: 10,
    prep: 10,
    description: 'Crisp rice crepe filled with tempered mashed potato masala, sambar & chutney.',
    desc: 'Crisp rice crepe filled with tempered mashed potato masala, sambar & chutney.',
    imageUrl: 'images/masaladosa.jfif',
    image: 'images/masaladosa.jfif',
    isVeg: true,
    veg: true,
    tags: ['Special'],
    stock: 15,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-4',
    name: 'Paneer Kathi Roll',
    category: 'Snacks',
    price: 80,
    prepTime: 10,
    prep: 10,
    description: 'Warm paratha wrap rolled with spicy cottage cheese chunks and onions.',
    desc: 'Warm paratha wrap rolled with spicy cottage cheese chunks and onions.',
    imageUrl: '',
    image: '',
    isVeg: true,
    veg: true,
    tags: ['Spicy'],
    stock: 12,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-5',
    name: 'Cold Coffee with Ice Cream',
    category: 'Beverages',
    price: 50,
    prepTime: 4,
    prep: 4,
    description: 'Creamy chilled blended espresso topped with a scoop of vanilla ice cream.',
    desc: 'Creamy chilled blended espresso topped with a scoop of vanilla ice cream.',
    imageUrl: 'images/coffee.jfif',
    image: 'images/coffee.jfif',
    isVeg: true,
    veg: true,
    tags: ['Bestseller', 'New'],
    stock: 25,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-6',
    name: 'Veg Dum Biryani',
    category: 'Meals',
    price: 110,
    prepTime: 12,
    prep: 12,
    description: 'Slow-cooked aromatic basmati rice infused with whole spices and fresh veggies.',
    desc: 'Slow-cooked aromatic basmati rice infused with whole spices and fresh veggies.',
    imageUrl: '',
    image: '',
    isVeg: true,
    veg: true,
    tags: ['Special'],
    stock: 0,
    isAvailable: false,
    available: false,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-7',
    name: 'Chole Bhature (2 pcs)',
    category: 'Meals',
    price: 90,
    prepTime: 10,
    prep: 10,
    description: 'Fluffy fried leavened bhature served with rich tangy chickpea curry.',
    desc: 'Fluffy fried leavened bhature served with rich tangy chickpea curry.',
    imageUrl: 'images/cholebhature.jfif',
    image: 'images/cholebhature.jfif',
    isVeg: true,
    veg: true,
    tags: ['Spicy'],
    stock: 18,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  },
  {
    id: 'item-8',
    name: 'Masala Maggi with Veggies',
    category: 'Quick Bites',
    price: 45,
    prepTime: 6,
    prep: 6,
    description: 'Classic college 2-minute noodles tossed with butter, onions, peas and masala.',
    desc: 'Classic college 2-minute noodles tossed with butter, onions, peas and masala.',
    imageUrl: 'images/maggi.jfif',
    image: 'images/maggi.jfif',
    isVeg: true,
    veg: true,
    tags: ['New'],
    stock: 30,
    isAvailable: true,
    available: true,
    isVisible: true,
    visible: true
  }
];

const DEFAULT_CATEGORIES = ['Snacks', 'Meals', 'Beverages', 'South Indian', 'Quick Bites'];

const DEFAULT_SLOT_SETTINGS = {
  openTime: '09:00',
  closeTime: '16:00',
  duration: 10,
  defaultMax: 8,
  lastOrderBufferMinutes: 15,
  breaks: [
    { start: '11:00', end: '11:30' }
  ]
};

// ==========================================================================
// 1. USER SESSION & AUTHENTICATION
// ==========================================================================

// BACKEND WILL DO THIS: Validate credentials and issue session token
async function login(role, credentials) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, ...credentials })
    });
    return await res.json();
  }

  // Local storage demo login
  let sessionData = null;
  if (role === 'student') {
    sessionData = {
      role: 'student',
      name: credentials.name || 'Student',
      rollNo: credentials.rollNo || credentials.collegeId || 'IT-001',
      collegeId: credentials.collegeId || credentials.rollNo || 'IT-001',
      phone: credentials.phone || '',
      timestamp: new Date().toISOString()
    };
  } else if (role === 'admin') {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      sessionData = {
        role: 'admin',
        username: 'admin',
        name: 'Canteen Manager',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid staff credentials');
    }
  }

  if (sessionData) {
    saveCurrentUser(sessionData);
    return sessionData;
  }
  return null;
}

/**
 * Saves current user session to sessionStorage (tab-isolated)
 * Also removes any legacy shared session left in localStorage
 */
function saveCurrentUser(user) {
  const sessionData = {
    ...user,
    timestamp: user.timestamp || new Date().toISOString()
  };
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionData));
  sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
  // Purge legacy shared session from localStorage
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  return sessionData;
}

async function saveSession(user) {
  return saveCurrentUser(user);
}

/**
 * Returns currently logged-in user synchronously or via await from sessionStorage
 */
function getCurrentUser() {
  const data = sessionStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.SESSION);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function getSession() {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/auth/session`);
    return await res.json();
  }
  return getCurrentUser();
}

async function logoutUser() {
  if (USE_BACKEND) {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  }
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

async function isLoggedIn() {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * Guard utility: checks if current session has the required role.
 * If not, redirects to login page.
 */
async function requireRole(allowedRole, redirectUrl = 'login.html') {
  const user = getCurrentUser();
  if (!user || user.role !== allowedRole) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

// ==========================================================================
// 2. MENU MANAGEMENT
// ==========================================================================

// BACKEND WILL DO THIS: Query active menu items from database
async function getMenu() {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/menu`);
    return await res.json();
  }

  const stored = localStorage.getItem(STORAGE_KEYS.MENU);
  if (stored) {
    try {
      const items = JSON.parse(stored);
      if (Array.isArray(items) && items.length > 0) {
        // One-time auto-migration: Replace external (http/https/pinimg) or empty image paths with local images
        let hasChanges = false;
        const updatedItems = items.map(item => {
          const currentImg = (item.imageUrl || item.image || '').trim();
          const localImg = LOCAL_IMAGE_MAP[item.name];
          if (localImg && (!currentImg || currentImg.startsWith('http') || currentImg.startsWith('//') || currentImg.includes('pinimg'))) {
            hasChanges = true;
            return {
              ...item,
              imageUrl: localImg,
              image: localImg
            };
          }
          return item;
        });

        if (hasChanges) {
          localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedItems));
        }

        return updatedItems.map(normalizeMenuItem);
      }
    } catch (e) {}
  }

  // Initialize sample menu items if empty
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
  return INITIAL_MENU_ITEMS.map(normalizeMenuItem);
}

async function saveMenu(items) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    return await res.json();
  }
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
  return items;
}

async function getCategories() {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}

async function saveCategories(categories) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return categories;
}

// BACKEND: POST /api/admin/menu (create) or PUT /api/admin/menu/:id (update)
// BACKEND WILL DO THIS: Validate payload, sanitize, and save item to database
async function saveMenuItem(item) {
  if (!item || typeof item !== 'object') {
    throw new Error('Valid menu item data is required');
  }
  if (!item.name || !item.name.trim()) {
    throw new Error('Item name is required');
  }
  if (!item.category || !item.category.trim()) {
    throw new Error('Item category is required');
  }
  const price = Number(item.price);
  if (isNaN(price) || price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  let stock = item.stock;
  if (stock !== null && stock !== undefined && stock !== '') {
    stock = Number(stock);
    if (isNaN(stock) || stock < 0) {
      throw new Error('Daily stock cannot be below 0');
    }
  } else {
    stock = null;
  }

  const menu = await getMenu();
  const normalizedInput = normalizeMenuItem({
    ...item,
    price,
    stock
  });

  // Stock rule: if stock is 0, item is automatically Sold Out
  if (normalizedInput.stock === 0) {
    normalizedInput.isAvailable = false;
    normalizedInput.available = false;
  }

  const existingIndex = item.id ? menu.findIndex(i => i.id === item.id) : -1;
  if (existingIndex !== -1) {
    menu[existingIndex] = {
      ...menu[existingIndex],
      ...normalizedInput
    };
    await saveMenu(menu);
    return menu[existingIndex];
  } else {
    const newItem = {
      ...normalizedInput,
      id: normalizedInput.id || ('item-' + Date.now())
    };
    menu.unshift(newItem);
    await saveMenu(menu);
    return newItem;
  }
}

// BACKEND: DELETE /api/admin/menu/:id
// BACKEND WILL DO THIS: Delete menu item from database and handle active order references
async function deleteMenuItem(id) {
  if (!id) {
    throw new Error('Item ID is required for deletion');
  }
  const menu = await getMenu();
  const item = menu.find(i => i.id === id);
  if (!item) {
    throw new Error(`Menu item not found: ${id}`);
  }
  const filtered = menu.filter(i => i.id !== id);
  await saveMenu(filtered);
  return item;
}

// BACKEND: PATCH /api/admin/menu/:id/availability
// BACKEND WILL DO THIS: Toggle item availability in database
async function setAvailability(id, value) {
  if (!id) {
    throw new Error('Item ID is required');
  }
  const menu = await getMenu();
  const item = menu.find(i => i.id === id);
  if (!item) {
    throw new Error(`Menu item not found: ${id}`);
  }
  const isAvailable = Boolean(value);

  // Stock rule: turning an item on while stock is 0 must be refused with a clear message
  if (isAvailable && item.stock === 0) {
    throw new Error(`Cannot mark "${item.name}" as available because stock is 0. Please add stock first!`);
  }

  item.isAvailable = isAvailable;
  item.available = isAvailable;
  await saveMenu(menu);
  return item;
}

// BACKEND: PATCH /api/admin/menu/:id/stock
// BACKEND WILL DO THIS: Update item inventory count and synchronize availability
async function updateItemStock(id, newStockOrChange) {
  if (!id) {
    throw new Error('Item ID is required');
  }
  const menu = await getMenu();
  const item = menu.find(i => i.id === id);
  if (!item) {
    throw new Error(`Menu item not found: ${id}`);
  }

  const currentStock = Number(item.stock) || 0;
  let newStock;

  if (typeof newStockOrChange === 'object' && newStockOrChange !== null) {
    if (newStockOrChange.stock !== undefined) {
      newStock = Number(newStockOrChange.stock);
    } else if (newStockOrChange.delta !== undefined) {
      newStock = currentStock + Number(newStockOrChange.delta);
    }
  } else if (typeof newStockOrChange === 'number') {
    newStock = currentStock + newStockOrChange;
  } else {
    throw new Error('Invalid stock change value');
  }

  newStock = Math.max(0, newStock);
  if (isNaN(newStock) || newStock < 0) {
    throw new Error('Stock cannot be below 0');
  }

  item.stock = newStock;

  // Stock rule: when stock reaches 0 the item shows as Sold out
  if (newStock === 0 && item.isAvailable) {
    item.isAvailable = false;
    item.available = false;
  }

  await saveMenu(menu);
  return item;
}

// BACKEND: POST /api/admin/menu/make-all-available
// BACKEND WILL DO THIS: Bulk-enable all visible menu items and replenish zero stock
async function makeAllAvailable() {
  const menu = await getMenu();
  menu.forEach(item => {
    if (item.isVisible !== false && item.visible !== false) {
      if (item.stock === 0) {
        item.stock = 10;
      }
      item.isAvailable = true;
      item.available = true;
    }
  });
  await saveMenu(menu);
  return menu;
}

// Normalizes field names between brief ({veg, prep, desc, image, available, visible})
// and admin ({isVeg, prepTime, description, imageUrl, isAvailable, isVisible})
function normalizeMenuItem(item) {
  return {
    ...item,
    prepTime: item.prepTime !== undefined ? item.prepTime : item.prep,
    prep: item.prep !== undefined ? item.prep : item.prepTime,
    description: item.description !== undefined ? item.description : item.desc,
    desc: item.desc !== undefined ? item.desc : item.description,
    imageUrl: item.imageUrl !== undefined ? item.imageUrl : item.image,
    image: item.image !== undefined ? item.image : item.imageUrl,
    isVeg: item.isVeg !== undefined ? item.isVeg : item.veg,
    veg: item.veg !== undefined ? item.veg : item.isVeg,
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : item.available,
    available: item.available !== undefined ? item.available : item.isAvailable,
    isVisible: item.isVisible !== undefined ? item.isVisible : item.visible,
    visible: item.visible !== undefined ? item.visible : item.isVisible
  };
}

// ==========================================================================
// 3. SHOPPING CART MANAGEMENT
// ==========================================================================

async function getCart() {
  const data = localStorage.getItem(STORAGE_KEYS.CART);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function saveCart(cartItems) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
  return cartItems;
}

async function addToCart(item) {
  const cart = await getCart();
  const existing = cart.find(i => i.id === item.id);

  if (existing) {
    existing.qty += (item.qty || 1);
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      isVeg: item.isVeg !== undefined ? Boolean(item.isVeg) : Boolean(item.veg),
      veg: item.veg !== undefined ? Boolean(item.veg) : Boolean(item.isVeg),
      image: item.image || item.imageUrl || '',
      imageUrl: item.imageUrl || item.image || '',
      qty: item.qty || 1
    });
  }

  await saveCart(cart);
  return cart;
}

async function updateCartItemQty(itemId, delta) {
  let cart = await getCart();
  const target = cart.find(i => i.id === itemId);

  if (target) {
    target.qty += delta;
    if (target.qty <= 0) {
      cart = cart.filter(i => i.id !== itemId);
    }
  }

  await saveCart(cart);
  return cart;
}

async function removeFromCart(itemId) {
  let cart = await getCart();
  cart = cart.filter(i => i.id !== itemId);
  await saveCart(cart);
  return cart;
}

async function clearCart() {
  localStorage.removeItem(STORAGE_KEYS.CART);
  return [];
}

async function getCartSummary() {
  const cart = await getCart();
  const totalCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 0)), 0);
  return {
    items: cart,
    totalCount,
    subtotal
  };
}

// ==========================================================================
// 4. TIME SLOTS CONFIGURATION & CAPACITY
// ==========================================================================

async function getSlotSettings() {
  const data = localStorage.getItem(STORAGE_KEYS.SLOT_SETTINGS) || localStorage.getItem(STORAGE_KEYS.SLOTS_CONFIG);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SLOT_SETTINGS, JSON.stringify(DEFAULT_SLOT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.SLOTS_CONFIG, JSON.stringify(DEFAULT_SLOT_SETTINGS));
    return { ...DEFAULT_SLOT_SETTINGS };
  }
  try {
    return { ...DEFAULT_SLOT_SETTINGS, ...JSON.parse(data) };
  } catch (err) {
    return { ...DEFAULT_SLOT_SETTINGS };
  }
}

async function saveSlotSettings(newSettings) {
  const updated = {
    ...DEFAULT_SLOT_SETTINGS,
    ...newSettings
  };
  localStorage.setItem(STORAGE_KEYS.SLOT_SETTINGS, JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEYS.SLOTS_CONFIG, JSON.stringify(updated));
  return updated;
}

// BACKEND WILL DO THIS: Query slot occupancy for a given date
async function getSlots(date = null) {
  if (USE_BACKEND) {
    const url = date ? `${API_BASE}/slots?date=${date}` : `${API_BASE}/slots`;
    const res = await fetch(url);
    return await res.json();
  }

  const stored = localStorage.getItem(STORAGE_KEYS.SLOTS);
  let slots = [];
  if (stored) {
    try {
      slots = JSON.parse(stored);
    } catch (e) {}
  }

  if (date) {
    return slots.filter(s => s.date === date);
  }
  return slots;
}

async function saveSlots(slots) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slots)
    });
    return await res.json();
  }
  localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  return slots;
}

// BACKEND WILL DO THIS: Generate selectable non-blocked time slots with space available
async function generateAvailableTimeSlots(targetDate = null) {
  const d = targetDate || new Date().toISOString().slice(0, 10);
  const slots = await getSlots(d);
  const settings = await getSlotSettings();

  // If slots exist for this date in cubite_slots, return active selectable ones
  if (slots.length > 0) {
    return slots
      .filter(s => !s.blocked && (s.bookedCount || 0) < s.maxOrders)
      .map(s => {
        const remaining = Math.max(0, s.maxOrders - (s.bookedCount || 0));
        return {
          id: s.id,
          date: s.date,
          start: s.start,
          end: s.end,
          label: `${formatSlotTime12(s.start)} - ${formatSlotTime12(s.end)}`,
          time: `${formatSlotTime12(s.start)}`,
          maxCapacity: s.maxOrders,
          bookedCount: s.bookedCount || 0,
          remaining: remaining,
          isAvailable: remaining > 0
        };
      });
  }

  // Fallback: generate from slot settings for target date
  const generated = [];
  const [startH, startM] = (settings.openTime || '09:00').split(':').map(Number);
  const [endH, endM] = (settings.closeTime || '16:00').split(':').map(Number);
  const duration = Number(settings.duration) || 10;
  const breaks = settings.breaks || [];

  let currentMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  while (currentMins + duration <= endMins) {
    const startStr = minutesToTimeStr(currentMins);
    const endStr = minutesToTimeStr(currentMins + duration);

    // Skip breaks
    const overlapsBreak = breaks.some(b => {
      const bStart = timeStrToMinutes(b.start);
      const bEnd = timeStrToMinutes(b.end);
      return !(currentMins + duration <= bStart || currentMins >= bEnd);
    });

    if (!overlapsBreak) {
      const label = `${formatSlotTime12(startStr)} - ${formatSlotTime12(endStr)}`;
      generated.push({
        id: `slot-${d}-${currentMins}`,
        date: d,
        start: startStr,
        end: endStr,
        label: label,
        time: `${formatSlotTime12(startStr)}`,
        maxCapacity: settings.defaultMax || 8,
        bookedCount: 0,
        remaining: settings.defaultMax || 8,
        isAvailable: true
      });
    }

    currentMins += duration;
  }

  return generated;
}

// Internal helper: checks if a slot's end time is in the past
function isSlotPastInternal(slot) {
  if (!slot || !slot.date) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (slot.date < today) return true;
  if (slot.date > today) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotEndMinutes = timeStrToMinutes(slot.end);
  return slotEndMinutes <= currentMinutes;
}

// BACKEND: POST /api/admin/slots/sync-booked-counts
// BACKEND WILL DO THIS: Aggregates order bookings per slot and persists count
async function syncBookedCounts() {
  const slots = await getSlots();
  const orders = await getOrders();
  let changed = false;

  slots.forEach(slot => {
    const matchingOrders = orders.filter(o => {
      if (!o || o.orderStatus === 'Cancelled' || o.orderStatus === 'Missed' || o.status === 'Cancelled' || o.status === 'Missed') {
        return false;
      }
      if (o.createdAt) {
        try {
          const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
          if (orderDate !== slot.date) return false;
        } catch (e) {}
      }
      const orderMins = timeStrToMinutes(o.slotTime);
      const slotStartMins = timeStrToMinutes(slot.start);
      const slotEndMins = timeStrToMinutes(slot.end);
      return (orderMins >= slotStartMins && orderMins < slotEndMins);
    });

    const newCount = matchingOrders.length;
    if ((slot.bookedCount || 0) !== newCount) {
      slot.bookedCount = newCount;
      changed = true;
    }
  });

  if (changed) {
    await saveSlots(slots);
  }
  return slots;
}

// BACKEND: POST /api/admin/slots/generate
// BACKEND WILL DO THIS: Generates non-conflicting time slots for date preserving booked slots
async function generateSlots(targetDate = null) {
  const date = targetDate || new Date().toISOString().slice(0, 10);
  const settings = await getSlotSettings();
  const allSlots = await getSlots();
  const existingDateSlots = allSlots.filter(s => s.date === date);

  const openMins = timeStrToMinutes(settings.openTime || '09:00');
  const closeMins = timeStrToMinutes(settings.closeTime || '16:00');
  const duration = Number(settings.duration) || 10;
  const defaultMax = Number(settings.defaultMax) || 8;
  const breaks = settings.breaks || [];

  if (closeMins <= openMins) {
    throw new Error('Closing time must be after opening time');
  }
  if (defaultMax < 1) {
    throw new Error('Default orders per slot must be 1 or more');
  }
  if (duration < 1) {
    throw new Error('Duration must be at least 1 minute');
  }

  let currentMins = openMins;
  const generated = [];

  while (currentMins + duration <= closeMins) {
    const start = minutesToTimeStr(currentMins);
    const end = minutesToTimeStr(currentMins + duration);
    const slotStartMins = currentMins;
    const slotEndMins = currentMins + duration;

    // Check if slot overlaps any break period
    const overlapsBreak = breaks.some(brk => {
      const bStart = timeStrToMinutes(brk.start);
      const bEnd = timeStrToMinutes(brk.end);
      return !(slotEndMins <= bStart || slotStartMins >= bEnd);
    });

    if (!overlapsBreak) {
      generated.push({
        id: `slot-${date}-${currentMins}`,
        date: date,
        start: start,
        end: end,
        maxOrders: defaultMax,
        bookedCount: 0,
        blocked: false
      });
    }

    currentMins += duration;
  }

  // Preserve existing slots on this date that have bookings
  const preservedBookedSlots = existingDateSlots.filter(s => (s.bookedCount || 0) > 0);
  const finalDateSlots = [...preservedBookedSlots];

  // Add generated slots that don't overlap preserved ones
  generated.forEach(gen => {
    const genStart = timeStrToMinutes(gen.start);
    const genEnd = timeStrToMinutes(gen.end);

    const overlapsPreserved = preservedBookedSlots.some(p => {
      const pStart = timeStrToMinutes(p.start);
      const pEnd = timeStrToMinutes(p.end);
      return !(genEnd <= pStart || genStart >= pEnd);
    });

    if (!overlapsPreserved) {
      finalDateSlots.push(gen);
    }
  });

  const otherDateSlots = allSlots.filter(s => s.date !== date);
  const updatedAllSlots = [...otherDateSlots, ...finalDateSlots];

  await saveSlots(updatedAllSlots);
  await syncBookedCounts();

  const refreshed = await getSlots(date);
  return refreshed;
}

// BACKEND: PATCH /api/admin/slots/:id/capacity
// BACKEND WILL DO THIS: Validate capacity constraints and update slot
async function updateSlotCapacity(slotId, newCapacity) {
  if (!slotId) throw new Error('Slot ID is required');
  const cap = parseInt(newCapacity, 10);
  if (isNaN(cap) || cap < 1) {
    throw new Error('Capacity must be at least 1');
  }

  const allSlots = await getSlots();
  const slot = allSlots.find(s => s.id === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }

  if (isSlotPastInternal(slot)) {
    throw new Error('Cannot edit capacity of a past slot');
  }

  if (cap < (slot.bookedCount || 0)) {
    throw new Error(`Cannot set capacity below booked orders (${slot.bookedCount || 0})`);
  }

  slot.maxOrders = cap;
  await saveSlots(allSlots);
  return slot;
}

// BACKEND: PATCH /api/admin/slots/:id/block
// BACKEND WILL DO THIS: Toggle slot block status
async function toggleBlockSlot(slotId, blocked = null) {
  if (!slotId) throw new Error('Slot ID is required');

  const allSlots = await getSlots();
  const slot = allSlots.find(s => s.id === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }

  if (isSlotPastInternal(slot)) {
    throw new Error('Cannot block or unblock a past slot');
  }

  slot.blocked = blocked !== null ? Boolean(blocked) : !slot.blocked;
  await saveSlots(allSlots);
  return slot;
}

// BACKEND: POST /api/admin/slots
// BACKEND WILL DO THIS: Validate time constraints, check overlaps and persist new slot
async function saveSlot(slotData) {
  if (!slotData || typeof slotData !== 'object') {
    throw new Error('Valid slot data is required');
  }

  const { date, start, end, maxOrders } = slotData;
  if (!date) throw new Error('Slot date is required');
  if (!start || !end) throw new Error('Start and end times are required');

  const startMins = timeStrToMinutes(start);
  const endMins = timeStrToMinutes(end);

  if (endMins <= startMins) {
    throw new Error('End time must be after start time');
  }

  const cap = parseInt(maxOrders || 8, 10);
  if (isNaN(cap) || cap < 1) {
    throw new Error('Capacity must be at least 1');
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  if (date < today || (date === today && endMins <= currentMins)) {
    throw new Error('Cannot add a slot for a past time window');
  }

  const allSlots = await getSlots();
  const dateSlots = allSlots.filter(s => s.date === date);

  const overlapping = dateSlots.find(s => {
    const sStart = timeStrToMinutes(s.start);
    const sEnd = timeStrToMinutes(s.end);
    return !(endMins <= sStart || startMins >= sEnd);
  });

  if (overlapping) {
    throw new Error(`Overlaps with existing slot: ${overlapping.start} – ${overlapping.end}`);
  }

  const newSlot = {
    id: slotData.id || `slot-${date}-${startMins}`,
    date,
    start,
    end,
    maxOrders: cap,
    bookedCount: 0,
    blocked: Boolean(slotData.blocked)
  };

  allSlots.push(newSlot);
  await saveSlots(allSlots);
  await syncBookedCounts();
  return newSlot;
}

// BACKEND: DELETE /api/admin/slots/:id
// BACKEND WILL DO THIS: Validate that bookedCount is 0 and delete slot
async function deleteSlot(slotId) {
  if (!slotId) throw new Error('Slot ID is required');

  const allSlots = await getSlots();
  const slot = allSlots.find(s => s.id === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }

  if ((slot.bookedCount || 0) > 0) {
    throw new Error('Cannot delete slot with existing bookings');
  }

  if (isSlotPastInternal(slot)) {
    throw new Error('Cannot delete a past slot');
  }

  const filtered = allSlots.filter(s => s.id !== slotId);
  await saveSlots(filtered);
  return slot;
}

// BACKEND: POST /api/admin/slots/bulk-block
// BACKEND WILL DO THIS: Bulk-block unpassed slots for target date
async function bulkBlockSlots(date) {
  if (!date) throw new Error('Date is required');

  const allSlots = await getSlots();
  let count = 0;

  allSlots.forEach(slot => {
    if (slot.date === date && !isSlotPastInternal(slot) && !slot.blocked) {
      slot.blocked = true;
      count++;
    }
  });

  if (count > 0) {
    await saveSlots(allSlots);
  }
  return { count, slots: allSlots.filter(s => s.date === date) };
}

// BACKEND: POST /api/admin/slots/bulk-capacity
// BACKEND WILL DO THIS: Bulk update unpassed slot capacities
async function bulkSetSlotCapacity(date, newCapacity) {
  if (!date) throw new Error('Date is required');
  const cap = parseInt(newCapacity, 10);
  if (isNaN(cap) || cap < 1) {
    throw new Error('Capacity must be at least 1');
  }

  const allSlots = await getSlots();
  let updatedCount = 0;
  let skippedCount = 0;

  allSlots.forEach(slot => {
    if (slot.date === date && !isSlotPastInternal(slot)) {
      if ((slot.bookedCount || 0) <= cap) {
        slot.maxOrders = cap;
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    await saveSlots(allSlots);
  }
  return { updatedCount, skippedCount, slots: allSlots.filter(s => s.date === date) };
}

// BACKEND: POST /api/admin/slots/bulk-unblock
// BACKEND WILL DO THIS: Bulk unblock slots for target date
async function bulkUnblockSlots(date) {
  if (!date) throw new Error('Date is required');

  const allSlots = await getSlots();
  let count = 0;

  allSlots.forEach(slot => {
    if (slot.date === date && slot.blocked) {
      slot.blocked = false;
      count++;
    }
  });

  if (count > 0) {
    await saveSlots(allSlots);
  }
  return { count, slots: allSlots.filter(s => s.date === date) };
}

// BACKEND: POST /api/admin/slots/settings/breaks
// BACKEND WILL DO THIS: Validate and add break period
async function addBreakPeriod(breakData = null) {
  const settings = await getSlotSettings();
  if (!settings.breaks) settings.breaks = [];

  if (settings.breaks.length >= 3) {
    throw new Error('Maximum 3 break periods allowed');
  }

  const brk = breakData || { start: "13:30", end: "14:00" };
  const bStart = timeStrToMinutes(brk.start);
  const bEnd = timeStrToMinutes(brk.end);

  if (bEnd <= bStart) {
    throw new Error('Break end time must be after start time');
  }

  const overlaps = settings.breaks.some(existing => {
    const eStart = timeStrToMinutes(existing.start);
    const eEnd = timeStrToMinutes(existing.end);
    return !(bEnd <= eStart || bStart >= eEnd);
  });

  if (overlaps) {
    throw new Error('Break period overlaps with an existing break');
  }

  settings.breaks.push({ start: brk.start, end: brk.end });
  await saveSlotSettings(settings);
  return settings;
}

// BACKEND: DELETE /api/admin/slots/settings/breaks/:index
// BACKEND WILL DO THIS: Remove break period by index
async function removeBreakPeriod(index) {
  const settings = await getSlotSettings();
  if (!settings.breaks || index < 0 || index >= settings.breaks.length) {
    throw new Error('Invalid break period index');
  }

  settings.breaks.splice(index, 1);
  await saveSlotSettings(settings);
  return settings;
}

// ==========================================================================
// 5. ORDERS MANAGEMENT & TRACKING
// ==========================================================================

// BACKEND WILL DO THIS: Query all orders from database
async function getOrders() {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/orders`);
    return await res.json();
  }

  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!data) return [];
  try {
    const orders = JSON.parse(data);
    return Array.isArray(orders) ? orders.map(normalizeOrder) : [];
  } catch (err) {
    return [];
  }
}

async function saveOrders(orders) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
    return await res.json();
  }
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  return orders;
}

// BACKEND WILL DO THIS: Validate items, calculate total, assign digital token,
// update slot booked count, deduct item daily stock, and save order to database
async function placeOrder(orderData) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  }

  const orders = await getOrders();
  const session = getCurrentUser() || {};
  const items = orderData.items || (await getCart());

  if (!items || items.length === 0) {
    throw new Error('Cart is empty. Please add items before placing order.');
  }

  // 1. Calculate total
  const calculatedTotal = items.reduce((sum, i) => sum + (Number(i.price) * (i.qty || 1)), 0);

  // 2. Generate digital token (e.g. #042)
  const token = orderData.token || (await generateNextToken());

  // 3. Normalize Order Object according to brief schema
  const newOrder = {
    id: orderData.id || `ORD-${Date.now()}`,
    token: token,
    studentName: orderData.studentName || session.name || 'Student',
    collegeId: orderData.collegeId || orderData.rollNo || session.collegeId || session.rollNo || 'N/A',
    rollNo: orderData.rollNo || orderData.collegeId || session.rollNo || session.collegeId || 'N/A',
    phone: orderData.phone || session.phone || '',
    items: items.map(i => ({
      name: i.name,
      qty: i.qty || 1,
      price: Number(i.price)
    })),
    total: Number(orderData.total) || calculatedTotal,
    totalAmount: Number(orderData.total) || calculatedTotal,
    slotTime: orderData.slotTime || '1:10 PM',
    orderStatus: orderData.orderStatus || 'Placed',
    status: orderData.orderStatus || 'Placed',
    paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'UPI' ? 'Paid' : 'Pending'),
    paymentMethod: orderData.paymentMethod || 'UPI',
    note: orderData.note || '',
    createdAt: new Date().toISOString()
  };

  // 4. Update daily stock in cubite_menu
  const menu = await getMenu();
  items.forEach(orderItem => {
    const menuItem = menu.find(m => m.name === orderItem.name || m.id === orderItem.id);
    if (menuItem && menuItem.stock !== null && menuItem.stock !== undefined) {
      menuItem.stock = Math.max(0, menuItem.stock - (orderItem.qty || 1));
      if (menuItem.stock === 0) {
        menuItem.isAvailable = false;
        menuItem.available = false;
      }
    }
  });
  await saveMenu(menu);

  // 5. Update slot bookedCount in cubite_slots
  const allSlots = await getSlots();
  const matchedSlot = allSlots.find(s => {
    const slot12 = `${formatSlotTime12(s.start)}`;
    const slotRange = `${formatSlotTime12(s.start)} - ${formatSlotTime12(s.end)}`;
    return newOrder.slotTime.includes(slot12) || newOrder.slotTime === slotRange || newOrder.slotTime.includes(s.start);
  });
  if (matchedSlot) {
    matchedSlot.bookedCount = (matchedSlot.bookedCount || 0) + 1;
    await saveSlots(allSlots);
  }

  // 6. Prepend order to cubite_orders
  orders.unshift(newOrder);
  await saveOrders(orders);

  // 7. Clear student cart
  await clearCart();

  return newOrder;
}

// BACKEND WILL DO THIS: Query student order history by college ID or roll number
async function getMyOrders(studentRollOrId = null) {
  const orders = await getOrders();
  const session = getCurrentUser();
  const targetId = (studentRollOrId || (session ? (session.collegeId || session.rollNo) : '')).toUpperCase().trim();

  if (!targetId) return orders;

  return orders.filter(o => {
    const cId = (o.collegeId || o.rollNo || '').toUpperCase().trim();
    return cId === targetId || (session && session.name && o.studentName === session.name);
  });
}

// BACKEND WILL DO THIS: Lookup order by token for counter dispatch verification
async function verifyToken(tokenQuery) {
  if (!tokenQuery) return null;
  const orders = await getOrders();
  const cleanQ = tokenQuery.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const cleanQNoZeros = cleanQ.replace(/^0+/, '');

  return orders.find(o => {
    const cleanToken = (o.token || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanTokenNoZeros = cleanToken.replace(/^0+/, '');
    return cleanToken === cleanQ || cleanTokenNoZeros === cleanQNoZeros;
  }) || null;
}

async function getOrderByToken(token) {
  return verifyToken(token);
}

async function getOrderById(orderId) {
  const orders = await getOrders();
  return orders.find(o => o.id === orderId) || null;
}

// BACKEND WILL DO THIS: Validate status progression and persist updates
async function updateOrderStatus(orderId, newStatus) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    return await res.json();
  }

  const validTransitions = {
    'Placed': 'Preparing',
    'Preparing': 'Ready',
    'Ready': 'Collected'
  };

  const orders = await getOrders();
  const order = orders.find(o => o.id === orderId || o.token === orderId);

  if (!order) return null;

  order.orderStatus = newStatus;
  order.status = newStatus;

  await saveOrders(orders);
  return order;
}

// BACKEND: PATCH /api/admin/orders/:id/payment
// BACKEND WILL DO THIS: Validate order payment state and mark as Paid
async function markOrderPaid(orderId) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'Paid' })
    });
    return await res.json();
  }

  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const orders = await getOrders();
  const order = orders.find(o => o.id === orderId || o.token === orderId);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const currentStatus = order.orderStatus || order.status;
  if (currentStatus === 'Cancelled' || currentStatus === 'Missed') {
    throw new Error(`Cannot mark payment for a ${currentStatus} order`);
  }

  if (order.paymentStatus !== 'Pending') {
    throw new Error(`Order is already marked as ${order.paymentStatus}`);
  }

  order.paymentStatus = 'Paid';
  await saveOrders(orders);
  return order;
}

// BACKEND: POST /api/admin/orders/bulk-status
// BACKEND WILL DO THIS: Batch transition orders with state validation
async function bulkUpdateOrderStatus(orderIds, newStatus) {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/admin/orders/bulk-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(orderIds || []), status: newStatus })
    });
    return await res.json();
  }

  if (!orderIds || (typeof orderIds[Symbol.iterator] !== 'function')) {
    throw new Error('Valid order IDs collection is required');
  }

  const idArray = Array.from(orderIds);
  if (idArray.length === 0) {
    return { updatedCount: 0, skippedCount: 0, skipped: [], orders: await getOrders() };
  }

  const validTransitions = {
    'Preparing': 'Placed',
    'Ready': 'Preparing',
    'Collected': 'Ready'
  };

  const requiredPrecedingStatus = validTransitions[newStatus];
  if (!requiredPrecedingStatus) {
    throw new Error(`Unsupported bulk target status: ${newStatus}`);
  }

  const orders = await getOrders();
  let updatedCount = 0;
  const skipped = [];

  idArray.forEach(id => {
    const order = orders.find(o => o.id === id || o.token === id);
    if (!order) {
      skipped.push({ id, reason: 'Order not found' });
      return;
    }

    const currentStatus = order.orderStatus || order.status;
    if (currentStatus === 'Cancelled' || currentStatus === 'Missed') {
      skipped.push({ id, token: order.token, reason: `already ${currentStatus}` });
      return;
    }

    if (currentStatus !== requiredPrecedingStatus) {
      skipped.push({
        id,
        token: order.token,
        reason: `not in ${requiredPrecedingStatus} status (is ${currentStatus})`
      });
      return;
    }

    order.orderStatus = newStatus;
    order.status = newStatus;
    updatedCount++;
  });

  if (updatedCount > 0) {
    await saveOrders(orders);
  }

  return {
    updatedCount,
    skippedCount: skipped.length,
    skipped,
    orders
  };
}

// BACKEND WILL DO THIS: Validate cancellation eligibility (only from Placed/Preparing),
// restore daily stock to menu, decrement slot bookedCount, and mark Cancelled
async function cancelOrder(orderId, reason = '', cancelledBy = '') {
  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, cancelledBy: cancelledBy || 'Not recorded' })
    });
    return await res.json();
  }

  const orders = await getOrders();
  const order = orders.find(o => o.id === orderId || o.token === orderId);

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.orderStatus === 'Ready' || order.orderStatus === 'Collected') {
    throw new Error('Cannot cancel an order that is already Ready or Collected.');
  }

  order.orderStatus = 'Cancelled';
  order.status = 'Cancelled';
  order.cancelReason = reason;
  order.cancelledBy = cancelledBy || 'Not recorded';

  // Set Paid orders to Refunded upon cancellation (leave Pending untouched)
  if (order.paymentStatus === 'Paid') {
    order.paymentStatus = 'Refunded';
  }

  // Restore daily stock in cubite_menu
  const menu = await getMenu();
  (order.items || []).forEach(orderItem => {
    const menuItem = menu.find(m => m.name === orderItem.name);
    if (menuItem && menuItem.stock !== null && menuItem.stock !== undefined) {
      menuItem.stock += (orderItem.qty || 1);
      if (menuItem.stock > 0) {
        menuItem.isAvailable = true;
        menuItem.available = true;
      }
    }
  });
  await saveMenu(menu);

  // Decrement slot bookedCount in cubite_slots
  const allSlots = await getSlots();
  const matchedSlot = allSlots.find(s => {
    const slot12 = formatSlotTime12(s.start);
    return order.slotTime.includes(slot12) || order.slotTime.includes(s.start);
  });
  if (matchedSlot && matchedSlot.bookedCount > 0) {
    matchedSlot.bookedCount -= 1;
    await saveSlots(allSlots);
  }

  await saveOrders(orders);
  return order;
}

// Normalizes order field names between brief and existing admin pages
function normalizeOrder(order) {
  return {
    ...order,
    orderStatus: order.orderStatus || order.status || 'Placed',
    status: order.status || order.orderStatus || 'Placed',
    total: order.total !== undefined ? order.total : order.totalAmount,
    totalAmount: order.totalAmount !== undefined ? order.totalAmount : order.total,
    collegeId: order.collegeId || order.rollNo || 'N/A',
    rollNo: order.rollNo || order.collegeId || 'N/A'
  };
}

// ==========================================================================
// 6. CANTEEN STATUS & DIGITAL TOKEN COUNTER
// ==========================================================================

async function isCanteenOpen() {
  const val = localStorage.getItem(STORAGE_KEYS.CANTEEN_OPEN);
  if (val === null) {
    localStorage.setItem(STORAGE_KEYS.CANTEEN_OPEN, 'true');
    return true;
  }
  return val === 'true';
}

async function setCanteenOpen(isOpen) {
  const boolVal = Boolean(isOpen);
  const strVal = boolVal ? 'true' : 'false';
  localStorage.setItem(STORAGE_KEYS.CANTEEN_OPEN, strVal);
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.CANTEEN_OPEN,
      newValue: strVal
    }));
  } catch (err) {}
  return boolVal;
}

// BACKEND WILL DO THIS: Generate sequential token formatted as #042
async function generateNextToken() {
  const current = Number(localStorage.getItem(STORAGE_KEYS.TOKEN_COUNTER)) || 41;
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.TOKEN_COUNTER, String(next));
  const padded = String(next).padStart(3, '0');
  return `#${padded}`;
}

async function resetTokenCounter() {
  localStorage.setItem(STORAGE_KEYS.TOKEN_COUNTER, '41');
}

// Legacy alias for older callers
async function saveOrder(orderData) {
  return placeOrder(orderData);
}

// ==========================================================================
// 7. TIME CONVERSION HELPERS
// ==========================================================================

function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = h < 10 ? '0' + h : String(h);
  const mm = m < 10 ? '0' + m : String(m);
  return `${hh}:${mm}`;
}

function formatSlotTime12(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}
