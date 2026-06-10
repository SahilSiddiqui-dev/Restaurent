'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { MenuItem, AddonGroup, AddonGroupItem, MenuItemAddon } from '@/lib/queries';
import { CartAddon } from '@/lib/cartStore';

interface AddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  addonGroups: AddonGroup[];
  addonGroupItems: AddonGroupItem[];
  menuItemAddons: MenuItemAddon[];
  onConfirm: (addons: CartAddon[], qty: number) => void;
  editMode?: boolean;
  initialAddons?: CartAddon[];
  initialQty?: number;
}

export default function AddonModal({
  isOpen,
  onClose,
  item,
  addonGroups,
  addonGroupItems,
  menuItemAddons,
  onConfirm,
  editMode = false,
  initialAddons = [],
  initialQty = 1,
}: AddonModalProps) {
  // Find addon groups linked to this specific menu item
  const linkedGroupIds = menuItemAddons
    .filter((ma) => ma.menu_item_id === item?.id)
    .map((ma) => ma.addon_group_id);

  const linkedGroups = addonGroups.filter((g) => linkedGroupIds.includes(g.id));

  // State for selected addons: { [groupId]: AddonGroupItem[] }
  const [selections, setSelections] = useState<Record<string, AddonGroupItem[]>>({});
  const [qty, setQty] = useState(initialQty);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Initialize selections when modal opens or item/addons change
  useEffect(() => {
    if (isOpen && item) {
      setQty(initialQty);
      setErrorBanner(null);

      const initialSelections: Record<string, AddonGroupItem[]> = {};

      linkedGroups.forEach((group) => {
        const groupItems = addonGroupItems.filter((i) => i.addon_group_id === group.id);

        if (editMode && initialAddons.length > 0) {
          // Edit mode: find pre-selected items
          const preSelected = groupItems.filter((gi) =>
            initialAddons.some((ia) => ia.id === gi.id)
          );
          initialSelections[group.id] = preSelected;
        } else {
          // New add: check for defaults or if required (select first if required & single-select)
          if (group.is_required && group.min_select === 1 && group.max_select === 1 && groupItems.length > 0) {
            initialSelections[group.id] = [groupItems[0]];
          } else {
            initialSelections[group.id] = [];
          }
        }
      });

      setSelections(initialSelections);
    }
  }, [isOpen, item, editMode]);

  if (!item) return null;

  const handleSelect = (group: AddonGroup, addonItem: AddonGroupItem) => {
    const currentGroupSelections = selections[group.id] || [];
    const isAlreadySelected = currentGroupSelections.some((s) => s.id === addonItem.id);

    let newSelections: AddonGroupItem[] = [];

    if (group.max_select === 1) {
      // Single select (radio behaviour)
      if (isAlreadySelected) {
        // If not required, toggle it off
        newSelections = group.is_required ? [addonItem] : [];
      } else {
        newSelections = [addonItem];
      }
    } else {
      // Multi select (checkbox behaviour)
      if (isAlreadySelected) {
        newSelections = currentGroupSelections.filter((s) => s.id !== addonItem.id);
      } else {
        if (currentGroupSelections.length < group.max_select) {
          newSelections = [...currentGroupSelections, addonItem];
        } else {
          // If max limit reached, remove first and add new (sliding window) or ignore. Let's ignore.
          newSelections = [...currentGroupSelections];
        }
      }
    }

    setSelections({
      ...selections,
      [group.id]: newSelections,
    });
    setErrorBanner(null);
  };

  // Calculate live total price
  const basePrice = Number(item.price);
  const addonsPrice = Object.values(selections)
    .flat()
    .reduce((sum, current) => sum + Number(current.extra_price), 0);
  const runningTotal = (basePrice + addonsPrice) * qty;

  const handleConfirm = () => {
    // Validate required selections
    for (const group of linkedGroups) {
      const selected = selections[group.id] || [];
      if (group.is_required && selected.length < group.min_select) {
        setErrorBanner(`Please select at least ${group.min_select} option(s) for "${group.name}".`);
        return;
      }
    }

    // Convert selections to CartAddon format
    const flatAddonsList: CartAddon[] = Object.values(selections)
      .flat()
      .map((addon) => ({
        id: addon.id,
        name: addon.name,
        extra_price: Number(addon.extra_price),
      }));

    onConfirm(flatAddonsList, qty);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
          {/* Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-[#141414] border border-[#222] rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col z-10 shadow-2xl"
          >
            {/* Header / Top Image */}
            <div className="relative h-48 sm:h-56 w-full flex-shrink-0 bg-[#0A0A0A]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-sm font-serif">
                  {item.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-foreground hover:scale-105 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Veg Badge on Image */}
              <div className="absolute top-4 left-4">
                <span className={item.is_veg ? 'badge-veg w-5 h-5 rounded bg-black/40' : 'badge-nonveg w-5 h-5 rounded bg-black/40'} />
              </div>

              {/* Food Info overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl sm:text-2xl font-semibold font-serif text-foreground leading-tight drop-shadow-md">
                  {item.name}
                </h3>
                <p className="text-accent text-lg font-semibold mt-1">
                  ₹{item.price}
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar pb-32">
              {item.description && (
                <p className="text-sm text-muted leading-relaxed border-b border-[#222] pb-4">
                  {item.description}
                </p>
              )}

              {errorBanner && (
                <div className="p-3 rounded-lg bg-non-veg/10 border border-non-veg/30 text-non-veg text-xs font-semibold">
                  {errorBanner}
                </div>
              )}

              {/* Addon Groups */}
              {linkedGroups.map((group) => {
                const groupItems = addonGroupItems.filter((i) => i.addon_group_id === group.id);
                if (groupItems.length === 0) return null;

                const selectedItems = selections[group.id] || [];
                const isRequiredUnsatisfied = group.is_required && selectedItems.length < group.min_select;

                return (
                  <div
                    key={group.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      isRequiredUnsatisfied
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-[#222] bg-[#0A0A0A]/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {group.name}
                          {group.is_required && (
                            <span className="text-xs text-accent px-1.5 py-0.5 rounded-full bg-accent/10">
                              Required
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          {group.max_select === 1
                            ? 'Select 1 option'
                            : `Select up to ${group.max_select} options`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {groupItems.map((addonItem) => {
                        const isSelected = selectedItems.some((s) => s.id === addonItem.id);

                        return (
                          <button
                            key={addonItem.id}
                            onClick={() => handleSelect(group, addonItem)}
                            className={`flex justify-between items-center p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-accent/10 border-accent text-foreground'
                                : 'bg-[#141414] border-[#222] hover:border-[#333] text-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Pill radio / checkbox indicator */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? 'bg-accent border-accent text-white'
                                    : 'border-[#333]'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-medium">{addonItem.name}</span>
                            </div>
                            <span className="text-xs font-semibold">
                              {Number(addonItem.extra_price) > 0 ? `+ ₹${addonItem.extra_price}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#141414] via-[#141414] to-[#141414]/90 border-t border-[#222] flex gap-3 items-center">
              {/* Qty Controls */}
              <div className="flex items-center bg-[#0A0A0A] border border-[#222] rounded-full p-1 h-12">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-[#141414]"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-[#141414]"
                >
                  +
                </button>
              </div>

              {/* Add CTA */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex-1 h-12 bg-accent hover:brightness-110 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all"
              >
                <span>
                  {editMode ? 'Update Order' : 'Add to Order'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span>₹{runningTotal.toFixed(2)}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
