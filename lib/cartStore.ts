import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartAddon {
  id: string;
  name: string;
  extra_price: number;
}

export interface CartItem {
  cartId: string; // unique identifier: item.id + sorted addon ids
  id: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string;
  is_veg: boolean;
  addons: CartAddon[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartId' | 'qty' | 'addons'>, addons: CartAddon[], qty?: number) => void;
  removeItem: (cartId: string) => void;
  updateQty: (cartId: string, qty: number) => void;
  updateAddons: (cartId: string, newAddons: CartAddon[]) => void;
  clearCart: () => void;
  getTotals: () => { subtotal: number; addonsTotal: number; total: number; count: number };
}

const generateCartId = (itemId: string, addons: CartAddon[]): string => {
  const sortedAddonIds = [...addons].map((a) => a.id).sort().join(',');
  return sortedAddonIds ? `${itemId}-${sortedAddonIds}` : itemId;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, addons, qty = 1) => {
        const cartId = generateCartId(item.id, addons);
        const existingItems = get().items;
        const existingItemIndex = existingItems.findIndex((i) => i.cartId === cartId);

        if (existingItemIndex > -1) {
          const updatedItems = [...existingItems];
          updatedItems[existingItemIndex].qty += qty;
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...existingItems,
              {
                ...item,
                cartId,
                qty,
                addons,
              },
            ],
          });
        }
      },

      removeItem: (cartId) => {
        set({ items: get().items.filter((item) => item.cartId !== cartId) });
      },

      updateQty: (cartId, qty) => {
        if (qty <= 0) {
          get().removeItem(cartId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.cartId === cartId ? { ...item, qty } : item
          ),
        });
      },

      updateAddons: (cartId, newAddons) => {
        const items = get().items;
        const targetItem = items.find((i) => i.cartId === cartId);
        if (!targetItem) return;

        const newCartId = generateCartId(targetItem.id, newAddons);

        // If cartId did not change, just update addons
        if (newCartId === cartId) {
          set({
            items: items.map((item) =>
              item.cartId === cartId ? { ...item, addons: newAddons } : item
            ),
          });
          return;
        }

        // If cartId changed, check if newCartId already exists
        const existingIndex = items.findIndex((i) => i.cartId === newCartId);
        if (existingIndex > -1) {
          // Merge quantities and remove the old item
          const updatedItems = [...items];
          updatedItems[existingIndex].qty += targetItem.qty;
          const filteredItems = updatedItems.filter((item) => item.cartId !== cartId);
          set({ items: filteredItems });
        } else {
          // Update details and the cartId
          set({
            items: items.map((item) =>
              item.cartId === cartId
                ? { ...item, cartId: newCartId, addons: newAddons }
                : item
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotals: () => {
        const items = get().items;
        let subtotal = 0;
        let addonsTotal = 0;
        let count = 0;

        items.forEach((item) => {
          subtotal += item.price * item.qty;
          const itemAddonsPrice = item.addons.reduce((sum, addon) => sum + addon.extra_price, 0);
          addonsTotal += itemAddonsPrice * item.qty;
          count += item.qty;
        });

        return {
          subtotal,
          addonsTotal,
          total: subtotal + addonsTotal,
          count,
        };
      },
    }),
    {
      name: 'citybite-cart-storage',
    }
  )
);
