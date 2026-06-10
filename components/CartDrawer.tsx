'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, Edit2 } from 'lucide-react';
import { useCartStore, CartItem } from '@/lib/cartStore';
import { MenuItem, AddonGroup, AddonGroupItem, MenuItemAddon } from '@/lib/queries';
import AddonModal from './AddonModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  addonGroups: AddonGroup[];
  addonGroupItems: AddonGroupItem[];
  menuItemAddons: MenuItemAddon[];
  menuItems: MenuItem[];
}

export default function CartDrawer({
  isOpen,
  onClose,
  onCheckout,
  addonGroups,
  addonGroupItems,
  menuItemAddons,
  menuItems,
}: CartDrawerProps) {
  const { items, updateQty, removeItem, updateAddons, getTotals } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // States for editing addons
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { subtotal, addonsTotal, total, count } = getTotals();

  const handleEditAddons = (item: CartItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedAddons = (newAddons: any[], newQty: number) => {
    if (editingItem) {
      updateAddons(editingItem.cartId, newAddons);
      updateQty(editingItem.cartId, newQty);
    }
  };

  const originalMenuItem = editingItem
    ? menuItems.find((mi) => mi.id === editingItem.id) || null
    : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                className="w-screen max-w-md bg-[#141414] border-l border-[#222] flex flex-col shadow-2xl"
              >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[#222] flex justify-between items-center bg-[#0A0A0A]">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Your Order ({count})
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-muted hover:text-foreground hover:bg-[#141414]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#222] flex items-center justify-center text-muted">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-md font-semibold text-foreground">
                          Your cart feels lonely
                        </h3>
                        <p className="text-xs text-muted max-w-[200px] mx-auto mt-1">
                          Add delicious items from the menu to start your feast.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full border border-[#222] hover:border-accent hover:text-accent text-xs font-semibold transition-colors bg-[#0A0A0A]"
                      >
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    items.map((item) => {
                      const addonsPrice = item.addons.reduce((sum, a) => sum + a.extra_price, 0);
                      const lineTotal = (item.price + addonsPrice) * item.qty;

                      return (
                        <div
                          key={item.cartId}
                          className="p-4 rounded-xl border border-[#222] bg-[#0A0A0A]/30 flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-3">
                              {/* Veg dot */}
                              <span
                                className={`mt-1 flex-shrink-0 ${
                                  item.is_veg ? 'badge-veg w-4 h-4 rounded' : 'badge-nonveg w-4 h-4 rounded'
                                }`}
                              />
                              <div>
                                <h3 className="text-sm font-semibold text-foreground leading-tight">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-accent font-medium mt-1">
                                  ₹{item.price}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Render Addons Selected */}
                          {item.addons.length > 0 && (
                            <div className="pl-7 pr-4">
                              <ul className="text-xs text-muted list-disc space-y-0.5">
                                {item.addons.map((addon, index) => (
                                  <li key={index}>
                                    {addon.name}{' '}
                                    {addon.extra_price > 0 && `(+₹${addon.extra_price})`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Line item actions */}
                          <div className="flex justify-between items-center pl-7 border-t border-[#222]/50 pt-2.5 mt-1">
                            <button
                              onClick={() => handleEditAddons(item)}
                              className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Customize
                            </button>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-[#0A0A0A] border border-[#222] rounded-full p-0.5">
                                <button
                                  onClick={() => updateQty(item.cartId, item.qty - 1)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground"
                                >
                                  {item.qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3 h-3" />}
                                </button>
                                <span className="w-6 text-center text-xs font-semibold">
                                  {item.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.cartId, item.qty + 1)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Section */}
                {items.length > 0 && (
                  <div className="p-4 sm:p-6 border-t border-[#222] bg-[#0A0A0A]/90 space-y-4">
                    <div className="space-y-2 text-sm text-muted">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {addonsTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Addons Total</span>
                          <span>₹{addonsTotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-[#222]/50">
                        <span>Grand Total</span>
                        <span className="text-accent">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onCheckout}
                      className="w-full h-12 bg-accent hover:brightness-110 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all cursor-pointer"
                    >
                      <span>Proceed to Order</span>
                      <X className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <span>₹{total.toFixed(2)}</span>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Re-usable AddonModal for edit mode */}
      <AddonModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={originalMenuItem}
        addonGroups={addonGroups}
        addonGroupItems={addonGroupItems}
        menuItemAddons={menuItemAddons}
        onConfirm={handleSaveEditedAddons}
        editMode={true}
        initialAddons={editingItem?.addons}
        initialQty={editingItem?.qty}
      />
    </>
  );
}
