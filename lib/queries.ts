import { supabase } from './supabase';

export interface Restaurant {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  logo_url?: string;
  cover_image_url?: string;
  phone: string;
  address: string;
  theme_color: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id?: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id?: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_available: boolean;
  display_order: number;
}

export interface AddonGroup {
  id: string;
  restaurant_id?: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
}

export interface AddonGroupItem {
  id: string;
  addon_group_id: string;
  name: string;
  extra_price: number;
  is_available: boolean;
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  addon_group_id: string;
}

export async function getSingleRestaurantMenu() {
  // 1. Fetch restaurant settings
  const { data: restaurant, error: rError } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (rError || !restaurant) {
    return null;
  }

  // 2. Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // 3. Fetch menu items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('display_order', { ascending: true });

  // 4. Fetch addon groups
  const { data: addonGroups } = await supabase
    .from('addon_groups')
    .select('*');

  // 5. Fetch addon group items
  const groupIds = addonGroups?.map((g) => g.id) || [];
  const { data: addonGroupItems } = groupIds.length > 0
    ? await supabase
        .from('addon_group_items')
        .select('*')
        .in('addon_group_id', groupIds)
        .eq('is_available', true)
    : { data: [] };

  // 6. Fetch mapping between menu items and addon groups
  const itemIds = menuItems?.map((i) => i.id) || [];
  const { data: menuItemAddons } = itemIds.length > 0
    ? await supabase
        .from('menu_item_addons')
        .select('*')
        .in('menu_item_id', itemIds)
    : { data: [] };

  // Map settings to keep compatibility with components that render slug or city
  const mappedRestaurant: Restaurant = {
    ...restaurant,
    slug: 'restaurant',
    city: 'local',
  };

  return {
    restaurant: mappedRestaurant,
    categories: (categories || []).map(c => ({ ...c, restaurant_id: restaurant.id })) as Category[],
    menuItems: (menuItems || []).map(i => ({ ...i, restaurant_id: restaurant.id })) as MenuItem[],
    addonGroups: (addonGroups || []).map(g => ({ ...g, restaurant_id: restaurant.id })) as AddonGroup[],
    addonGroupItems: (addonGroupItems || []) as AddonGroupItem[],
    menuItemAddons: (menuItemAddons || []) as MenuItemAddon[],
  };
}
