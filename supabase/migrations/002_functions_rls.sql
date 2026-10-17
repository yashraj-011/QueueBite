-- ============================================================================
-- QueueBite Supabase PostgreSQL Functions & RLS Policies
-- Migration: 002_functions_rls.sql
-- ============================================================================

-- Function: Atomic Order Placement
-- Handles:
-- 1. Check canteen open status
-- 2. Validate and reserve slot capacity (row-level lock)
-- 3. Validate item availability and finite stock deduction (row-level lock)
-- 4. Calculate total securely on server
-- 5. Allocate daily sequential token
-- 6. Insert order and order items
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

  -- Verify slot is not in the past for today
  v_service_date := v_slot.slot_date;
  IF v_service_date < CURRENT_DATE OR (v_service_date = CURRENT_DATE AND v_slot.end_time <= LOCALTIME) THEN
    RAISE EXCEPTION 'Cannot book a time slot in the past.';
  END IF;

  v_slot_time_snapshot := TO_CHAR(v_slot.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(v_slot.end_time, 'HH12:MI AM');

  -- 4. Determine initial payment status
  IF p_payment_method = 'UPI' THEN
    v_payment_status := 'Paid';
  ELSE
    v_payment_status := 'Pending';
  END IF;

  -- 5. Allocate sequential daily token
  v_token := public.fn_allocate_daily_token(v_service_date);
  v_order_id := gen_random_uuid();

  -- 6. Insert Order Header Shell (total updated after summing items)
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

-- Function: Atomic Order Cancellation
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

    -- Check cutoff: must be at least 15 minutes before slot start
    IF v_order.pickup_slot_id IS NOT NULL THEN
      SELECT * INTO v_slot FROM public.pickup_slots WHERE id = v_order.pickup_slot_id;
      IF FOUND THEN
        IF v_slot.slot_date = CURRENT_DATE AND (v_slot.start_time - INTERVAL '15 minutes') <= LOCALTIME THEN
          RAISE EXCEPTION 'Cancellation deadline has passed (cutoff is 15 minutes prior to slot).';
        END IF;
      END IF;
    END IF;
  ELSE
    -- Staff/Admin can cancel if not terminal
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent role escalation

-- 2. MENU ITEMS
CREATE POLICY "Menu items readable by everyone"
ON public.menu_items FOR SELECT TO public USING (is_visible = true OR auth.role() = 'service_role');

-- 3. PICKUP SLOTS
CREATE POLICY "Pickup slots readable by authenticated users"
ON public.pickup_slots FOR SELECT TO authenticated USING (true);

-- 4. ORDERS
CREATE POLICY "Students can read their own orders"
ON public.orders FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- 5. ORDER ITEMS
CREATE POLICY "Students can read items of their orders"
ON public.order_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')))
  )
);

-- 6. CANTEEN SETTINGS
CREATE POLICY "Canteen settings readable by all"
ON public.canteen_settings FOR SELECT TO public USING (true);
