-- ============================================================================
-- QueueBite Supabase PostgreSQL Complete Setup Script
-- Tables, Constraints, Indexes, Functions, Triggers, RLS, and Seed Data
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. BASE TABLES
-- ============================================================================

-- 1.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  college_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Snacks',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image_url TEXT,
  preparation_minutes INTEGER NOT NULL DEFAULT 5 CHECK (preparation_minutes >= 0),
  dietary_classification TEXT NOT NULL DEFAULT 'veg' CHECK (dietary_classification IN ('veg', 'non-veg', 'vegan', 'egg')),
  tags TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT NULL CHECK (stock IS NULL OR stock >= 0), -- NULL = unlimited
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.3 PICKUP SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.pickup_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INTEGER NOT NULL DEFAULT 8 CHECK (max_orders >= 1),
  booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_slot_window UNIQUE (slot_date, start_time, end_time),
  CONSTRAINT valid_slot_range CHECK (end_time > start_time)
);

-- 1.4 DAILY TOKEN SEQUENCE COUNTERS
CREATE TABLE IF NOT EXISTS public.daily_token_counters (
  service_date DATE PRIMARY KEY,
  last_token_number INTEGER NOT NULL DEFAULT 0
);

-- 1.5 CANTEEN SETTINGS
CREATE TABLE IF NOT EXISTS public.canteen_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  canteen_open BOOLEAN NOT NULL DEFAULT true,
  opening_time TIME NOT NULL DEFAULT '09:00',
  closing_time TIME NOT NULL DEFAULT '16:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 10 CHECK (slot_duration_minutes >= 5),
  default_slot_capacity INTEGER NOT NULL DEFAULT 8 CHECK (default_slot_capacity >= 1),
  last_order_buffer_minutes INTEGER NOT NULL DEFAULT 15,
  collection_grace_period_minutes INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 1.6 CANTEEN BREAKS
CREATE TABLE IF NOT EXISTS public.canteen_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_break_range CHECK (end_time > start_time)
);

-- 1.7 ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  service_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  student_name_snapshot TEXT NOT NULL,
  college_id_snapshot TEXT NOT NULL,
  phone_snapshot TEXT,
  pickup_slot_id UUID REFERENCES public.pickup_slots(id) ON DELETE RESTRICT,
  slot_time_snapshot TEXT NOT NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  order_status TEXT NOT NULL DEFAULT 'Placed' 
    CHECK (order_status IN ('Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled', 'Missed')),
  payment_status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
  payment_method TEXT NOT NULL DEFAULT 'UPI'
    CHECK (payment_method IN ('UPI', 'Pay at counter')),
  note TEXT,
  cancel_reason TEXT,
  cancelled_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_daily_token UNIQUE (service_date, token)
);

-- 1.8 ORDER ITEMS SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_date ON public.orders(service_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_slots_date ON public.pickup_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_menu_category ON public.menu_items(category);

-- ============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Touch updated_at function
CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_profiles ON public.profiles;
CREATE TRIGGER trg_touch_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_menu ON public.menu_items;
CREATE TRIGGER trg_touch_menu BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_orders ON public.orders;
CREATE TRIGGER trg_touch_orders BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- Sequential daily token counter allocation (e.g. #001)
CREATE OR REPLACE FUNCTION public.fn_allocate_daily_token(p_service_date DATE)
RETURNS TEXT AS $$
DECLARE
  v_num INTEGER;
BEGIN
  INSERT INTO public.daily_token_counters (service_date, last_token_number)
  VALUES (p_service_date, 1)
  ON CONFLICT (service_date)
  DO UPDATE SET last_token_number = public.daily_token_counters.last_token_number + 1
  RETURNING last_token_number INTO v_num;

  RETURN '#' || LPAD(v_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Atomic Order Placement Procedure
CREATE OR REPLACE FUNCTION public.fn_place_order_atomic(
  p_user_id UUID,
  p_pickup_slot_id UUID,
  p_payment_method TEXT,
  p_note TEXT,
  p_items JSONB -- Array of { menu_item_id, quantity }
)
RETURNS JSONB AS $$
DECLARE
  v_canteen_open BOOLEAN;
  v_slot RECORD;
  v_user RECORD;
  v_token TEXT;
  v_service_date DATE;
  v_slot_time_snapshot TEXT;
  v_order_id UUID;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_menu_item RECORD;
  v_item_qty INTEGER;
  v_line_total NUMERIC(10, 2);
  v_payment_status TEXT;
BEGIN
  -- 1. Check canteen status
  SELECT canteen_open INTO v_canteen_open FROM public.canteen_settings WHERE id = 1;
  IF v_canteen_open IS FALSE THEN
    RAISE EXCEPTION 'Canteen is currently closed for new orders.';
  END IF;

  -- 2. Fetch User Profile Snapshot
  SELECT name, college_id, phone INTO v_user FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  -- 3. Lock & validate pickup slot
  SELECT * INTO v_slot FROM public.pickup_slots
  WHERE id = p_pickup_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup slot not found.';
  END IF;

  IF v_slot.is_blocked THEN
    RAISE EXCEPTION 'This pickup slot has been blocked by the canteen staff.';
  END IF;

  IF v_slot.booked_count >= v_slot.max_orders THEN
    RAISE EXCEPTION 'This pickup slot is fully booked. Please choose another slot.';
  END IF;

  -- Verify slot date is not in the past
  v_service_date := v_slot.slot_date;
  IF v_service_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book a time slot in the past.';
  END IF;

  v_slot_time_snapshot := TO_CHAR(v_slot.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(v_slot.end_time, 'HH12:MI AM');

  -- 4. Initial payment status
  IF p_payment_method = 'UPI' THEN
    v_payment_status := 'Paid';
  ELSE
    v_payment_status := 'Pending';
  END IF;

  -- 5. Allocate sequential daily token
  v_token := public.fn_allocate_daily_token(v_service_date);
  v_order_id := gen_random_uuid();

  -- 6. Insert Order Header Shell
  INSERT INTO public.orders (
    id, token, service_date, user_id,
    student_name_snapshot, college_id_snapshot, phone_snapshot,
    pickup_slot_id, slot_time_snapshot, total,
    order_status, payment_status, payment_method, note
  ) VALUES (
    v_order_id, v_token, v_service_date, p_user_id,
    v_user.name, v_user.college_id, v_user.phone,
    v_slot.id, v_slot_time_snapshot, 0,
    'Placed', v_payment_status, p_payment_method, p_note
  );

  -- 7. Process Order Items & Deduct Stock Atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_qty := (v_item->>'quantity')::INTEGER;
    IF v_item_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero.';
    END IF;

    -- Row-level lock on menu item to avoid race conditions
    SELECT * INTO v_menu_item FROM public.menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item % not found.', (v_item->>'menu_item_id');
    END IF;

    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'Item % is currently not available.', v_menu_item.name;
    END IF;

    -- Finite stock check & deduction
    IF v_menu_item.stock IS NOT NULL THEN
      IF v_menu_item.stock < v_item_qty THEN
        RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %', v_menu_item.name, v_menu_item.stock, v_item_qty;
      END IF;

      UPDATE public.menu_items
      SET stock = stock - v_item_qty,
          is_available = CASE WHEN (stock - v_item_qty) <= 0 THEN false ELSE is_available END
      WHERE id = v_menu_item.id;
    END IF;

    v_line_total := v_menu_item.price * v_item_qty;
    v_total := v_total + v_line_total;

    INSERT INTO public.order_items (
      order_id, menu_item_id, item_name_snapshot,
      quantity, unit_price_snapshot, line_total
    ) VALUES (
      v_order_id, v_menu_item.id, v_menu_item.name,
      v_item_qty, v_menu_item.price, v_line_total
    );
  END LOOP;

  -- 8. Update Order Total
  UPDATE public.orders SET total = v_total WHERE id = v_order_id;

  -- 9. Increment slot booked count
  UPDATE public.pickup_slots SET booked_count = booked_count + 1 WHERE id = v_slot.id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'token', v_token,
    'total', v_total,
    'status', 'Placed',
    'payment_status', v_payment_status,
    'slot_time', v_slot_time_snapshot
  );
END;
$$ LANGUAGE plpgsql;

-- Atomic Order Cancellation Function
CREATE OR REPLACE FUNCTION public.fn_cancel_order_atomic(
  p_order_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_slot RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- Student cancellation constraints
  IF p_role = 'student' THEN
    IF v_order.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Unauthorized to cancel this order.';
    END IF;

    IF v_order.order_status <> 'Placed' THEN
      RAISE EXCEPTION 'Students can only cancel orders in Placed status.';
    END IF;
  ELSE
    IF v_order.order_status IN ('Collected', 'Cancelled', 'Missed') THEN
      RAISE EXCEPTION 'Cannot cancel an order that is already in terminal state (%).', v_order.order_status;
    END IF;
  END IF;

  -- Restore menu item stock
  FOR v_item IN SELECT menu_item_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.menu_item_id IS NOT NULL THEN
      UPDATE public.menu_items
      SET stock = stock + v_item.quantity,
          is_available = true
      WHERE id = v_item.menu_item_id AND stock IS NOT NULL;
    END IF;
  END LOOP;

  -- Decrement slot booked count
  IF v_order.pickup_slot_id IS NOT NULL THEN
    UPDATE public.pickup_slots
    SET booked_count = GREATEST(0, booked_count - 1)
    WHERE id = v_order.pickup_slot_id;
  END IF;

  -- Update order record
  UPDATE public.orders
  SET order_status = 'Cancelled',
      payment_status = CASE WHEN payment_status = 'Paid' THEN 'Refunded' ELSE payment_status END,
      cancelled_by = p_role,
      cancel_reason = p_reason
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'Cancelled',
    'payment_status', CASE WHEN v_order.payment_status = 'Paid' THEN 'Refunded' ELSE v_order.payment_status END
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_settings ENABLE ROW LEVEL SECURITY;

-- 4.1 PROFILES
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4.2 MENU ITEMS
DROP POLICY IF EXISTS "Menu items readable by everyone" ON public.menu_items;
CREATE POLICY "Menu items readable by everyone"
ON public.menu_items FOR SELECT TO public USING (is_visible = true OR auth.role() = 'service_role');

-- 4.3 PICKUP SLOTS
DROP POLICY IF EXISTS "Pickup slots readable by authenticated users" ON public.pickup_slots;
CREATE POLICY "Pickup slots readable by authenticated users"
ON public.pickup_slots FOR SELECT TO authenticated USING (true);

-- 4.4 ORDERS
DROP POLICY IF EXISTS "Students can read their own orders" ON public.orders;
CREATE POLICY "Students can read their own orders"
ON public.orders FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- 4.5 ORDER ITEMS
DROP POLICY IF EXISTS "Students can read items of their orders" ON public.order_items;
CREATE POLICY "Students can read items of their orders"
ON public.order_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')))
  )
);

-- 4.6 CANTEEN SETTINGS
DROP POLICY IF EXISTS "Canteen settings readable by all" ON public.canteen_settings;
CREATE POLICY "Canteen settings readable by all"
ON public.canteen_settings FOR SELECT TO public USING (true);

-- ============================================================================
-- 5. SEED DATA
-- ============================================================================

-- 5.1 Canteen Settings (Singleton)
INSERT INTO public.canteen_settings (id, canteen_open, opening_time, closing_time, slot_duration_minutes, default_slot_capacity, last_order_buffer_minutes, collection_grace_period_minutes)
VALUES (1, true, '09:00', '16:00', 10, 8, 15, 30)
ON CONFLICT (id) DO UPDATE SET
  canteen_open = EXCLUDED.canteen_open,
  opening_time = EXCLUDED.opening_time,
  closing_time = EXCLUDED.closing_time;

-- 5.2 Canteen Breaks
INSERT INTO public.canteen_breaks (start_time, end_time)
VALUES 
  ('11:00', '11:30'),
  ('13:30', '14:00')
ON CONFLICT DO NOTHING;

-- 5.3 Default Menu Items
INSERT INTO public.menu_items (id, name, category, price, description, image_url, preparation_minutes, dietary_classification, tags, stock, is_available, is_visible)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Samosa (2 pcs)',
    'Snacks',
    25.00,
    'Crispy golden triangular pastries stuffed with spiced potatoes and sweet green peas, served with mint and tamarind chutney.',
    '/images/samosa.jpg',
    5,
    'veg',
    ARRAY['Bestseller', 'Campus Favorite'],
    45,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Veg Grilled Sandwich',
    'Quick Bites',
    60.00,
    'Fresh tomatoes, cucumber, bell peppers with herb green chutney and butter, grilled crisp with molten cheese.',
    '/images/sandwich.jfif',
    8,
    'veg',
    ARRAY['Bestseller', 'Healthy'],
    30,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Masala Dosa',
    'South Indian',
    70.00,
    'Authentic crisp fermented rice & lentil crepe filled with aromatic spiced potato mash, served with coconut chutney & piping hot sambar.',
    '/images/masaladosa.jfif',
    10,
    'veg',
    ARRAY['Special', 'Chef Choice'],
    20,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Cold Coffee with Ice Cream',
    'Beverages',
    50.00,
    'Creamy chilled blended Arabica espresso topped with a generous scoop of artisanal vanilla bean ice cream and chocolate drizzle.',
    '/images/coffee.jfif',
    4,
    'veg',
    ARRAY['Popular', 'Chilled'],
    40,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Chole Bhature (2 pcs)',
    'Meals',
    85.00,
    'Spicy Punjabi chickpea curry simmered with whole spices, served with two fluffy puffed bhaturas, pickled onions, and green chili.',
    '/images/cholebhature.jfif',
    12,
    'veg',
    ARRAY['Hearty Meal', 'Crowd Favorite'],
    25,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Masala Maggi with Veggies',
    'Quick Bites',
    40.00,
    'Classic masala noodles cooked with diced onions, carrots, sweet corn, and a touch of butter and secret spices.',
    '/images/maggi.jfif',
    6,
    'veg',
    ARRAY['Hostel Favorite'],
    50,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'Kande Pohe',
    'Breakfast',
    30.00,
    'Traditional tempered flattened rice cooked with sautéed onions, mustard seeds, curry leaves, crunchy roasted peanuts, and fresh cilantro.',
    '/images/kandepohe.jpg',
    5,
    'veg',
    ARRAY['Healthy Breakfast'],
    35,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Fresh Lime Soda',
    'Beverages',
    30.00,
    'Refreshing freshly squeezed lemon juice with sparkling club soda, rock salt, and sweet mint syrup.',
    '',
    3,
    'vegan',
    ARRAY['Refreshing', 'Cooler'],
    60,
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  preparation_minutes = EXCLUDED.preparation_minutes,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available,
  is_visible = EXCLUDED.is_visible;
