-- ============================================================================
-- QueueBite Supabase Seed Data
-- Realistic Canteen Menu, Default Settings, and Pickup Slots
-- ============================================================================

-- 1. Default Canteen Settings
INSERT INTO public.canteen_settings (id, canteen_open, opening_time, closing_time, slot_duration_minutes, default_slot_capacity, last_order_buffer_minutes, collection_grace_period_minutes)
VALUES (1, true, '09:00', '16:00', 10, 8, 15, 30)
ON CONFLICT (id) DO UPDATE SET
  canteen_open = EXCLUDED.canteen_open,
  opening_time = EXCLUDED.opening_time,
  closing_time = EXCLUDED.closing_time;

-- 2. Canteen Breaks
INSERT INTO public.canteen_breaks (start_time, end_time)
VALUES 
  ('11:00', '11:30'),
  ('13:30', '14:00')
ON CONFLICT DO NOTHING;

-- 3. Realistic Menu Items with high-quality descriptions and prices in INR
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
