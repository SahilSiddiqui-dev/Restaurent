-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurant Settings (Single-Row config table)
CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  theme_color TEXT DEFAULT '#FF4D00',
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Menu categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- 4. Addon Groups
CREATE TABLE addon_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Addon Group Items
CREATE TABLE addon_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_group_id UUID REFERENCES addon_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  extra_price NUMERIC(10, 2) DEFAULT 0.00,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_addon_group_items_group ON addon_group_items(addon_group_id);

-- 6. Link table for menu items and addon groups
CREATE TABLE menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  addon_group_id UUID REFERENCES addon_groups(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(menu_item_id, addon_group_id)
);

CREATE INDEX idx_menu_item_addons_item ON menu_item_addons(menu_item_id);

-- 7. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC(10, 8),
  customer_lng NUMERIC(11, 8),
  items JSONB NOT NULL, 
  -- items schema: [{id, name, price, qty, addons: [{name, extra_price}]}]
  addons_total NUMERIC(10, 2) DEFAULT 0.00,
  subtotal NUMERIC(10, 2) DEFAULT 0.00,
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  special_instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_orders_status ON orders(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------

-- Restaurant Settings Policies
CREATE POLICY "Allow public read of settings" ON restaurant_settings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin read of settings" ON restaurant_settings
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Allow admin update of settings" ON restaurant_settings
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- Categories Policies
CREATE POLICY "Allow public read of active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin manage categories" ON categories
  FOR ALL TO authenticated USING (true);

-- Menu Items Policies
CREATE POLICY "Allow public read of available items" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Allow admin manage menu items" ON menu_items
  FOR ALL TO authenticated USING (true);

-- Addon Groups Policies
CREATE POLICY "Allow public read of addon groups" ON addon_groups
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage addon groups" ON addon_groups
  FOR ALL TO authenticated USING (true);

-- Addon Group Items Policies
CREATE POLICY "Allow public read of addon group items" ON addon_group_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Allow admin manage addon group items" ON addon_group_items
  FOR ALL TO authenticated USING (true);

-- Menu Item Addons Policies
CREATE POLICY "Allow public read of menu item addons" ON menu_item_addons
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage menu item addons" ON menu_item_addons
  FOR ALL TO authenticated USING (true);

-- Orders Policies
CREATE POLICY "Allow public insert of orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read/write of orders" ON orders
  FOR ALL TO authenticated USING (true);

-- Enable Realtime for Orders
alter publication supabase_realtime add table orders;
