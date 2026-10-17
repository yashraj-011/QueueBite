-- ============================================================================
-- QueueBite Supabase PostgreSQL Schema Definition
-- Migration: 001_initial_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  college_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. MENU ITEMS TABLE
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
  stock INTEGER DEFAULT NULL CHECK (stock IS NULL OR stock >= 0), -- NULL means unlimited
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PICKUP SLOTS TABLE
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

-- 4. DAILY TOKEN SEQUENCE COUNTER
CREATE TABLE IF NOT EXISTS public.daily_token_counters (
  service_date DATE PRIMARY KEY,
  last_token_number INTEGER NOT NULL DEFAULT 0
);

-- 5. CANTEEN SETTINGS
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

-- 6. CANTEEN BREAKS
CREATE TABLE IF NOT EXISTS public.canteen_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_break_range CHECK (end_time > start_time)
);

-- 7. ORDERS TABLE
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

-- 8. ORDER ITEMS SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_date ON public.orders(service_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_slots_date ON public.pickup_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_menu_category ON public.menu_items(category);

-- ============================================================================
-- ATOMIC STORED FUNCTIONS
-- ============================================================================

-- Function to allocate next sequential daily token (e.g. #001)
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

-- Trigger to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_touch_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

CREATE OR REPLACE TRIGGER trg_touch_menu BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

CREATE OR REPLACE TRIGGER trg_touch_orders BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();
