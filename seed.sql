-- Clear existing mock data (optional)
-- TRUNCATE menu_item_addons, addon_group_items, addon_groups, menu_items, categories, orders, restaurant_settings CASCADE;

-- Insert Restaurant Settings (Single row)
-- Note: Replace owner_id with actual auth.users.id in your Supabase admin panel if you want to log in as admin!
INSERT INTO restaurant_settings (id, name, logo_url, cover_image_url, phone, address, theme_color, is_active)
VALUES
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Burger Hub & Cafe',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop',
    '8707095544',
    '123 Gourmet St, Bandra West, Mumbai',
    '#FF4D00',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, display_order, is_active)
VALUES
  ('c1010000-0000-0000-0000-000000000000', '🔥 Bestsellers', 1, true),
  ('c1020000-0000-0000-0000-000000000000', 'Classic Burgers', 2, true),
  ('c1050000-0000-0000-0000-000000000000', 'Artisanal Pizzas', 3, true),
  ('c1060000-0000-0000-0000-000000000000', 'Cafe Coffee & Brews', 4, true),
  ('c1030000-0000-0000-0000-000000000000', 'Crunchy Sides', 5, true),
  ('c1040000-0000-0000-0000-000000000000', 'Cold Drinks', 6, true);

-- Insert Addon Groups
INSERT INTO addon_groups (id, name, is_required, min_select, max_select)
VALUES
  ('e1010000-0000-0000-0000-000000000000', 'Make it better 👇', false, 0, 3),
  ('e1020000-0000-0000-0000-000000000000', 'Choose Beverage Size', true, 1, 1),
  ('e1030000-0000-0000-0000-000000000000', 'Select Pizza Size (Required) 🍕', true, 1, 1),
  ('e1040000-0000-0000-0000-000000000000', 'Extra Toppings', false, 0, 4),
  ('e1050000-0000-0000-0000-000000000000', 'Milk Preferences', false, 0, 1);

-- Insert Addon Group Items
INSERT INTO addon_group_items (id, addon_group_id, name, extra_price, is_available)
VALUES
  -- Burger Customizers
  ('d1010001-0000-0000-0000-000000000000', 'e1010000-0000-0000-0000-000000000000', 'Extra Cheese Slice', 20.00, true),
  ('d1010002-0000-0000-0000-000000000000', 'e1010000-0000-0000-0000-000000000000', 'Crispy Bacon Strip', 40.00, true),
  ('d1010003-0000-0000-0000-000000000000', 'e1010000-0000-0000-0000-000000000000', 'Fried Egg', 15.00, true),
  -- Drink Customizers
  ('d1020001-0000-0000-0000-000000000000', 'e1020000-0000-0000-0000-000000000000', 'Regular (300ml)', 0.00, true),
  ('d1020002-0000-0000-0000-000000000000', 'e1020000-0000-0000-0000-000000000000', 'Medium (+₹20)', 20.00, true),
  ('d1020003-0000-0000-0000-000000000000', 'e1020000-0000-0000-0000-000000000000', 'Large (+₹40)', 40.00, true),
  -- Pizza Size Customizers
  ('d1030001-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000', 'Regular 8"', 0.00, true),
  ('d1030002-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000', 'Medium 10" (+₹120)', 120.00, true),
  ('d1030003-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000', 'Large 12" (+₹240)', 240.00, true),
  -- Pizza Topping Customizers
  ('d1040001-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000', 'Black Olives', 30.00, true),
  ('d1040002-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000', 'Sliced Mushrooms', 40.00, true),
  ('d1040003-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000', 'Spicy Jalapeños', 30.00, true),
  ('d1040004-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000', 'Extra Mozzarella', 50.00, true),
  -- Coffee Customizers
  ('d1050001-0000-0000-0000-000000000000', 'e1050000-0000-0000-0000-000000000000', 'Almond Milk (+₹40)', 40.00, true),
  ('d1050002-0000-0000-0000-000000000000', 'e1050000-0000-0000-0000-000000000000', 'Oat Milk (+₹50)', 50.00, true);

-- Insert Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, image_url, is_veg, is_available, display_order)
VALUES
  -- 1. Bestsellers
  (
    'f1010001-0000-0000-0000-000000000000',
    'c1010000-0000-0000-0000-000000000000',
    'Signature Triple Cheese Burger',
    'Three flame-grilled juicy patties smothered in melted cheddar, secret sauce, served on toasted brioche.',
    289.00,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    false,
    true,
    1
  ),
  (
    'f1010002-0000-0000-0000-000000000000',
    'c1010000-0000-0000-0000-000000000000',
    'Double Mozzarella Margherita Pizza',
    'Classic neapolitan thin crust with rich marinara sauce, fresh basil leaves, and extra melted mozzarella cheese.',
    279.00,
    'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600',
    true,
    true,
    2
  ),
  -- 2. Classic Burgers
  (
    'f1020001-0000-0000-0000-000000000000',
    'c1020000-0000-0000-0000-000000000000',
    'Crispy Aloo Patty Burger',
    'Golden potato patty seasoned with local Mumbai spices, topped with onions, tomatoes, and spicy herb mayo.',
    129.00,
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600',
    true,
    true,
    1
  ),
  (
    'f1020002-0000-0000-0000-000000000000',
    'c1020000-0000-0000-0000-000000000000',
    'Smoky BBQ Chicken Burger',
    'Tender grilled chicken breast glazed with hickory smoke BBQ sauce, crispy onions, and Swiss cheese.',
    219.00,
    'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600',
    false,
    true,
    2
  ),
  -- 3. Artisanal Pizzas
  (
    'f1050001-0000-0000-0000-000000000000',
    'c1050000-0000-0000-0000-000000000000',
    'Garden Fresh Veggie Pizza',
    'Freshly baked hand-tossed dough loaded with bell peppers, sweet corn, black olives, onions, and mushrooms.',
    329.00,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    true,
    true,
    1
  ),
  (
    'f1050002-0000-0000-0000-000000000000',
    'c1050000-0000-0000-0000-000000000000',
    'Ultimate Double Pepperoni Feast',
    'Premium marinara base, loaded with two layers of spicy pork pepperoni and loaded stringy mozzarella cheese.',
    429.00,
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
    false,
    true,
    2
  ),
  -- 4. Cafe Coffee & Brews
  (
    'f1060001-0000-0000-0000-000000000000',
    'c1060000-0000-0000-0000-000000000000',
    'Vanilla Latte Cappuccino',
    'Rich espresso shot combined with steamed milk, topped with a thick layer of silky foam and vanilla syrup.',
    149.00,
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
    true,
    true,
    1
  ),
  (
    'f1060002-0000-0000-0000-000000000000',
    'c1060000-0000-0000-0000-000000000000',
    'Iced Hazelnut Frappe Cold Brew',
    'Slow-brewed dark coffee poured over ice cubes, blended with roasted hazelnut syrup and sweet cream.',
    179.00,
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
    true,
    true,
    2
  ),
  (
    'f1060003-0000-0000-0000-000000000000',
    'c1060000-0000-0000-0000-000000000000',
    'Double Shot Dark Espresso',
    'Full-bodied, intense dark espresso shot pulled fresh with beautiful caramel-colored crema on top.',
    99.00,
    'https://images.unsplash.com/photo-1510707513156-46b3dc2ca482?w=600',
    true,
    true,
    3
  ),
  -- 5. Sides
  (
    'f1030001-0000-0000-0000-000000000000',
    'c1030000-0000-0000-0000-000000000000',
    'Loaded Cheesy Fries',
    'Crispy golden fries drenched in warm cheddar cheese sauce, topped with chopped jalapeños.',
    159.00,
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600',
    true,
    true,
    1
  ),
  -- 6. Cold Drinks
  (
    'f1040001-0000-0000-0000-000000000000',
    'c1040000-0000-0000-0000-000000000000',
    'Ice Cold Coca-Cola',
    'Chilled fizzy classic cola, the perfect companion to your hot burger.',
    59.00,
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600',
    true,
    true,
    1
  );

-- Link Menu Items with Addon Groups (menu_item_addons)
INSERT INTO menu_item_addons (menu_item_id, addon_group_id)
VALUES
  -- Burgers + Extras
  ('f1010001-0000-0000-0000-000000000000', 'e1010000-0000-0000-0000-000000000000'), 
  ('f1020002-0000-0000-0000-000000000000', 'e1010000-0000-0000-0000-000000000000'), 
  -- Coke + Sizes
  ('f1040001-0000-0000-0000-000000000000', 'e1020000-0000-0000-0000-000000000000'),
  -- Pizzas + Sizes + Toppings
  ('f1010002-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000'),
  ('f1010002-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000'),
  ('f1050001-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000'),
  ('f1050001-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000'),
  ('f1050002-0000-0000-0000-000000000000', 'e1030000-0000-0000-0000-000000000000'),
  ('f1050002-0000-0000-0000-000000000000', 'e1040000-0000-0000-0000-000000000000'),
  -- Coffee + Milk choices
  ('f1060001-0000-0000-0000-000000000000', 'e1050000-0000-0000-0000-000000000000'),
  ('f1060002-0000-0000-0000-000000000000', 'e1050000-0000-0000-0000-000000000000');
