'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Eye, Flame, Award, Clock } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { Restaurant, Category, MenuItem, AddonGroup, AddonGroupItem, MenuItemAddon } from '@/lib/queries';
import AddonModal from './AddonModal';
import CartDrawer from './CartDrawer';

interface RestaurantMenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  addonGroups: AddonGroup[];
  addonGroupItems: AddonGroupItem[];
  menuItemAddons: MenuItemAddon[];
}

export default function RestaurantMenuClient({
  restaurant,
  categories,
  menuItems,
  addonGroups,
  addonGroupItems,
  menuItemAddons,
}: RestaurantMenuClientProps) {
  const router = useRouter();
  const { items, addItem, getTotals } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Addon Modal States
  const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // References
  const menuSectionsRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setMounted(true);
    if (categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  // Render the menu directly. Zustand values (count, total) are safeguarded with 'mounted' checks below.
  const { total, count } = getTotals();

  // Apply custom theme colors locally
  const themeStyles = {
    '--accent': restaurant.theme_color || '#FF4D00',
    '--accent-secondary': '#FFB347',
  } as React.CSSProperties;

  // Filter items based on search query
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Check if an item has any addons
  const hasAddons = (itemId: string) => {
    return menuItemAddons.some((ma) => ma.menu_item_id === itemId);
  };

  const handleAddItem = (item: MenuItem) => {
    if (hasAddons(item.id)) {
      setSelectedItemForAddons(item);
      setIsAddonModalOpen(true);
    } else {
      // Direct add
      addItem(
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          image_url: item.image_url,
          is_veg: item.is_veg,
        },
        [] // No addons
      );
    }
  };

  const handleAddonOptionsConfirm = (addons: any[], qty: number) => {
    if (selectedItemForAddons) {
      addItem(
        {
          id: selectedItemForAddons.id,
          name: selectedItemForAddons.name,
          price: Number(selectedItemForAddons.price),
          image_url: selectedItemForAddons.image_url,
          is_veg: selectedItemForAddons.is_veg,
        },
        addons,
        qty
      );
    }
  };

  const scrollToSection = (categoryId: string) => {
    setActiveCategory(categoryId);
    const section = menuSectionsRef.current[categoryId];
    if (section) {
      const offset = 120; // sticky header + category bar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = section.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleCheckoutRedirect = () => {
    router.push('/checkout');
  };

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-foreground pb-24">
      {/* 1. FLOATING HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#222]/80 px-4 py-3 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-10 h-10 rounded-full object-cover border border-[#222]"
            />
          )}
          <div>
            <h1 className="font-serif text-lg leading-tight font-semibold tracking-wide">
              {restaurant.name}
            </h1>
            <p className="text-[10px] text-muted capitalize leading-none mt-0.5">
              📍 {restaurant.city}
            </p>
          </div>
        </div>

        {/* Cart Trigger Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative w-12 h-12 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center hover:scale-105 transition-transform"
        >
          <ShoppingBag className="w-5 h-5 text-accent" />
          {mounted && count > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse-soft">
              {count}
            </span>
          )}
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative h-[65vh] w-full flex items-center justify-center overflow-hidden">
        {restaurant.cover_image_url ? (
          <img
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0A0A0A]" />
        )}
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 text-center px-4 max-w-xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
            Delicious Local Culinary
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif leading-tight">
            Order Fresh. <br />Eat Happy.
          </h2>
          <p className="text-sm text-muted">
            Crafted gourmet food delivered straight from the kitchen of <span className="text-foreground font-semibold">{restaurant.name}</span> in {restaurant.city}.
          </p>
          <button
            onClick={() => {
              const element = document.getElementById('menu-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex items-center gap-2 bg-accent hover:brightness-110 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-lg shadow-accent/20 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            See Our Menu →
          </button>
        </div>
      </section>

      {/* Main Container */}
      <main id="menu-section" className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 3. SEARCH BAR */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#222] rounded-full py-3.5 pl-12 pr-6 text-sm text-foreground placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>

        {/* 4. CATEGORIES STICKY NAVIGATION */}
        {!searchQuery && (
          <div className="sticky top-[64px] z-30 bg-[#0A0A0A]/95 py-3 border-b border-[#222]/50 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToSection(category.id)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                      isActive
                        ? 'bg-accent border-accent text-white'
                        : 'bg-transparent border-[#222] text-muted hover:border-[#333] hover:text-foreground'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. MENU ITEMS DISPLAY */}
        {searchQuery ? (
          /* Search Results view */
          <div className="space-y-6">
            <h3 className="text-lg font-serif">Search Results ({filteredItems.length})</h3>
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">No menu items match your search.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} hasAddons={hasAddons(item.id)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Grouped view */
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryItems = menuItems.filter((mi) => mi.category_id === category.id);
              if (categoryItems.length === 0) return null;

              return (
                <div
                  key={category.id}
                  ref={(el) => {
                    menuSectionsRef.current[category.id] = el;
                  }}
                  className="space-y-4 pt-4"
                >
                  <h3 className="text-xl sm:text-2xl font-serif border-b border-[#222] pb-2">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} hasAddons={hasAddons(item.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. MOBILE STICKY BOTTOM BAR */}
      {mounted && count > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-accent text-white px-5 py-3.5 rounded-2xl flex justify-between items-center shadow-lg shadow-accent/30 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <div>
                <span className="font-bold text-sm">{count} Items</span>
                <span className="text-[10px] block opacity-80">Tap to view cart</span>
              </div>
            </div>
            <span className="font-bold text-base">₹{total.toFixed(2)} →</span>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckoutRedirect}
        addonGroups={addonGroups}
        addonGroupItems={addonGroupItems}
        menuItemAddons={menuItemAddons}
        menuItems={menuItems}
      />

      {/* Addon Selection Modal */}
      <AddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        item={selectedItemForAddons}
        addonGroups={addonGroups}
        addonGroupItems={addonGroupItems}
        menuItemAddons={menuItemAddons}
        onConfirm={handleAddonOptionsConfirm}
      />
    </div>
  );
}

// Sub-component for individual menu cards
interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  hasAddons: boolean;
}

function MenuItemCard({ item, onAdd, hasAddons }: MenuItemCardProps) {
  // Generate random tags or indices for bestsellers / popular options
  const isBestseller = item.display_order === 1;
  const isMostOrdered = item.display_order === 2;

  return (
    <div className="flex flex-col bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:scale-[1.02] hover:border-[#333] transition-all duration-300">
      {/* Cover Photo */}
      <div className="relative aspect-[16/9] w-full bg-[#0A0A0A] overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted font-serif text-xs">
            {item.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

        {/* Veg/Nonveg dot */}
        <div className="absolute top-3 left-3 bg-black/40 p-1 rounded">
          <span className={item.is_veg ? 'badge-veg w-4 h-4 rounded' : 'badge-nonveg w-4 h-4 rounded'} />
        </div>

        {/* Social Proof Tags */}
        {isBestseller && (
          <span className="absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            🔥 Bestseller
          </span>
        )}
        {isMostOrdered && (
          <span className="absolute top-3 right-3 bg-accent-secondary text-[#0A0A0A] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            ⚡ Most Ordered Today
          </span>
        )}
      </div>

      {/* Info Body */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-base text-foreground leading-snug line-clamp-1">
            {item.name}
          </h4>
          {item.description ? (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed h-8">
              {item.description}
            </p>
          ) : (
            <div className="h-8" />
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-accent font-sans">
            ₹{item.price}
          </span>
          <button
            onClick={() => onAdd(item)}
            className="bg-accent text-white text-xs font-semibold px-4 py-2 rounded-full border border-accent hover:bg-transparent hover:text-accent transition-all duration-200 cursor-pointer"
          >
            + Add {hasAddons && <span className="text-[10px] opacity-75 font-normal ml-0.5">(custom)</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
