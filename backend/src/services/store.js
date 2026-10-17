import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

// Initial realistic catalog matching the confirmed requirements and local image assets
const INITIAL_MENU = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Samosa (2 pcs)',
    category: 'Snacks',
    price: 25.0,
    description: 'Crispy golden triangular pastries stuffed with spiced potatoes and sweet green peas, served with mint & tamarind chutney.',
    image_url: '/images/samosa.jpg',
    preparation_minutes: 5,
    dietary_classification: 'veg',
    tags: ['Bestseller', 'Campus Favorite'],
    stock: 45,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Veg Grilled Sandwich',
    category: 'Quick Bites',
    price: 60.0,
    description: 'Fresh vegetables with herb green chutney and butter grilled crisp with molten cheese.',
    image_url: '/images/sandwich.jfif',
    preparation_minutes: 8,
    dietary_classification: 'veg',
    tags: ['Bestseller', 'Healthy'],
    stock: 30,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Masala Dosa',
    category: 'South Indian',
    price: 70.0,
    description: 'Crisp fermented crepe filled with spiced potato mash, served with coconut chutney & piping hot sambar.',
    image_url: '/images/masaladosa.jfif',
    preparation_minutes: 10,
    dietary_classification: 'veg',
    tags: ['Special', 'Chef Choice'],
    stock: 20,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Cold Coffee with Ice Cream',
    category: 'Beverages',
    price: 50.0,
    description: 'Creamy chilled blended Arabica espresso topped with a scoop of vanilla ice cream and chocolate drizzle.',
    image_url: '/images/coffee.jfif',
    preparation_minutes: 4,
    dietary_classification: 'veg',
    tags: ['Popular', 'Chilled'],
    stock: 40,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Chole Bhature (2 pcs)',
    category: 'Meals',
    price: 85.0,
    description: 'Spicy chickpea curry simmered with spices, served with two fluffy puffed bhaturas and pickled onions.',
    image_url: '/images/cholebhature.jfif',
    preparation_minutes: 12,
    dietary_classification: 'veg',
    tags: ['Hearty Meal', 'Crowd Favorite'],
    stock: 25,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Masala Maggi with Veggies',
    category: 'Quick Bites',
    price: 40.0,
    description: 'Classic masala noodles cooked with diced onions, carrots, sweet corn, and a touch of butter.',
    image_url: '/images/maggi.jfif',
    preparation_minutes: 6,
    dietary_classification: 'veg',
    tags: ['Hostel Favorite'],
    stock: 50,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Kande Pohe',
    category: 'Breakfast',
    price: 30.0,
    description: 'Traditional flattened rice cooked with sautéed onions, mustard seeds, crunchy peanuts, and fresh cilantro.',
    image_url: '/images/kandepohe.jpg',
    preparation_minutes: 5,
    dietary_classification: 'veg',
    tags: ['Healthy Breakfast'],
    stock: 35,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 30.0,
    description: 'Refreshing freshly squeezed lemon juice with sparkling club soda, rock salt, and sweet mint syrup.',
    image_url: '',
    preparation_minutes: 3,
    dietary_classification: 'vegan',
    tags: ['Refreshing', 'Cooler'],
    stock: 60,
    is_available: true,
    is_visible: true,
    created_at: new Date().toISOString()
  }
];

class MemoryStore {
  constructor() {
    this.profiles = new Map([
      ['admin-uuid-001', {
        id: 'admin-uuid-001',
        name: 'Canteen Administrator',
        college_id: 'ADMIN-01',
        phone: '9876543210',
        role: 'admin',
        created_at: new Date().toISOString()
      }],
      ['staff-uuid-001', {
        id: 'staff-uuid-001',
        name: 'Head Chef Kitchen',
        college_id: 'STAFF-01',
        phone: '9876543211',
        role: 'staff',
        created_at: new Date().toISOString()
      }],
      ['student-uuid-001', {
        id: 'student-uuid-001',
        name: 'Aarav Sharma',
        college_id: 'IT-101',
        phone: '9876543212',
        role: 'student',
        created_at: new Date().toISOString()
      }]
    ]);

    this.menu = new Map(INITIAL_MENU.map(item => [item.id, { ...item }]));
    this.slots = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.dailyTokens = new Map(); // date -> number

    this.settings = {
      id: 1,
      canteen_open: true,
      opening_time: '09:00',
      closing_time: '16:00',
      slot_duration_minutes: 10,
      default_slot_capacity: 8,
      last_order_buffer_minutes: 15,
      collection_grace_period_minutes: 30,
      updated_at: new Date().toISOString()
    };

    this.breaks = [
      { id: 'break-1', start_time: '11:00', end_time: '11:30' },
      { id: 'break-2', start_time: '13:30', end_time: '14:00' }
    ];

    // Pre-populate today's slots
    this.generateDefaultSlotsForDate(new Date().toISOString().slice(0, 10));
  }

  generateDefaultSlotsForDate(dateStr) {
    const [startH, startM] = this.settings.opening_time.split(':').map(Number);
    const [endH, endM] = this.settings.closing_time.split(':').map(Number);
    const duration = this.settings.slot_duration_minutes;

    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (cur + duration <= end) {
      const sh = String(Math.floor(cur / 60)).padStart(2, '0');
      const sm = String(cur % 60).padStart(2, '0');
      const eh = String(Math.floor((cur + duration) / 60)).padStart(2, '0');
      const em = String((cur + duration) % 60).padStart(2, '0');
      const startT = `${sh}:${sm}`;
      const endT = `${eh}:${em}`;

      const overlapsBreak = this.breaks.some(b => {
        const [bsh, bsm] = b.start_time.split(':').map(Number);
        const [beh, bem] = b.end_time.split(':').map(Number);
        const bStart = bsh * 60 + bsm;
        const bEnd = beh * 60 + bem;
        return !(cur + duration <= bStart || cur >= bEnd);
      });

      if (!overlapsBreak) {
        const slotId = `slot-${dateStr}-${startT.replace(':', '')}`;
        if (!this.slots.has(slotId)) {
          this.slots.set(slotId, {
            id: slotId,
            slot_date: dateStr,
            start_time: startT,
            end_time: endT,
            max_orders: this.settings.default_slot_capacity,
            booked_count: 0,
            is_blocked: false,
            created_at: new Date().toISOString()
          });
        }
      }
      cur += duration;
    }
  }

  getNextDailyToken(dateStr) {
    const cur = this.dailyTokens.get(dateStr) || 0;
    const next = cur + 1;
    this.dailyTokens.set(dateStr, next);
    return `#${String(next).padStart(3, '0')}`;
  }
}

export const memoryStore = new MemoryStore();
