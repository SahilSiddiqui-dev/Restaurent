'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Check, X, Tag, ListFilter, IndianRupee } from 'lucide-react';
import { Category, MenuItem, AddonGroup, MenuItemAddon } from '@/lib/queries';

type SubTabType = 'items' | 'categories';

export default function MenuManagementPage() {
  const { restaurant } = useAdmin();

  // State Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [menuItemAddons, setMenuItemAddons] = useState<MenuItemAddon[]>([]);

  // Page UI States
  const [activeTab, setActiveTab] = useState<SubTabType>('items');
  const [loading, setLoading] = useState(true);

  // Category Form States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // MenuItem Form States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemVeg, setItemVeg] = useState(true);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemImage, setItemImage] = useState('');
  const [selectedAddonGroups, setSelectedAddonGroups] = useState<string[]>([]); // linked addon group ids

  const fetchData = useCallback(async () => {
    if (!restaurant) return;

    try {
      setLoading(true);

      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      // Fetch menu items
      const { data: itemData } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });

      // Fetch addon groups for linking
      const { data: addonData } = await supabase
        .from('addon_groups')
        .select('*');

      // Fetch linked menu item addons
      const { data: itemAddonsData } = await supabase
        .from('menu_item_addons')
        .select('*');

      setCategories((catData || []) as Category[]);
      setMenuItems((itemData || []) as MenuItem[]);
      setAddonGroups((addonData || []) as AddonGroup[]);
      setMenuItemAddons((itemAddonsData || []) as MenuItemAddon[]);
    } catch (err) {
      console.error('Error fetching menu data:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    fetchData();
  }, [restaurant, fetchData]);

  // CATEGORY OPERATIONS
  const openCategoryModal = (cat: Category | null = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create
        const displayOrder = categories.length + 1;
        const { error } = await supabase.from('categories').insert({
          name: categoryName,
          display_order: displayOrder,
          is_active: true,
        });

        if (error) throw error;
      }

      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All menu items inside it will be permanently deleted.')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  // MENU ITEM OPERATIONS
  const openItemModal = (item: MenuItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDesc(item.description || '');
      setItemPrice(item.price.toString());
      setItemCategory(item.category_id);
      setItemVeg(item.is_veg);
      setItemAvailable(item.is_available);
      setItemImage(item.image_url || '');

      // Load linked addon groups
      const linked = menuItemAddons
        .filter((ma) => ma.menu_item_id === item.id)
        .map((ma) => ma.addon_group_id);
      setSelectedAddonGroups(linked);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemPrice('');
      setItemCategory(categories[0]?.id || '');
      setItemVeg(true);
      setItemAvailable(true);
      setItemImage('');
      setSelectedAddonGroups([]);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      let savedItemId = '';

      if (editingItem) {
        // Update Item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: itemName,
            description: itemDesc || null,
            price: Number(itemPrice),
            category_id: itemCategory,
            is_veg: itemVeg,
            is_available: itemAvailable,
            image_url: itemImage || null,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        savedItemId = editingItem.id;
      } else {
        // Create Item
        const displayOrder = menuItems.length + 1;
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            category_id: itemCategory,
            name: itemName,
            description: itemDesc || null,
            price: Number(itemPrice),
            image_url: itemImage || null,
            is_veg: itemVeg,
            is_available: itemAvailable,
            display_order: displayOrder,
          })
          .select('id')
          .single();

        if (error) throw error;
        savedItemId = data.id;
      }

      // Sync Linked Addon Groups
      // 1. Delete all existing link mappings for this item
      await supabase.from('menu_item_addons').delete().eq('menu_item_id', savedItemId);

      // 2. Insert new mappings
      if (selectedAddonGroups.length > 0) {
        const insertPayload = selectedAddonGroups.map((groupId) => ({
          menu_item_id: savedItemId,
          addon_group_id: groupId,
        }));
        const { error: linkError } = await supabase.from('menu_item_addons').insert(insertPayload);
        if (linkError) throw linkError;
      }

      setIsItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error saving menu item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    const nextVal = !item.is_available;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: nextVal })
        .eq('id', item.id);

      if (error) throw error;

      // Optimistic update
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: nextVal } : m))
      );
    } catch (err: any) {
      alert(`Error updating item state: ${err.message}`);
    }
  };

  const handleToggleAddonGroupSelect = (groupId: string) => {
    setSelectedAddonGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  if (!restaurant) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Menu Configuration</h2>
          <p className="text-xs text-muted">Manage food categories, items, and addon attachments</p>
        </div>

        <button
          onClick={() => (activeTab === 'items' ? openItemModal() : openCategoryModal())}
          className="bg-accent hover:brightness-110 text-white font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-accent/10 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'items' ? 'Menu Item' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222]/80 gap-1">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Menu Items ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-t-2 border-accent animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted">Refreshing menu datasets...</p>
        </div>
      ) : activeTab === 'items' ? (
        // Menu Items Grid
        menuItems.length === 0 ? (
          <div className="py-16 text-center border border-[#222] rounded-3xl bg-[#141414]/30">
            <Tag className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No menu items found</h3>
            <p className="text-xs text-muted mt-1">
              Add your first dish to make it available for customer ordering.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const cat = categories.find((c) => c.id === item.category_id);
              const linkedAddonCount = menuItemAddons.filter((ma) => ma.menu_item_id === item.id).length;

              return (
                <div
                  key={item.id}
                  className={`bg-[#141414] border rounded-2xl p-4 flex gap-4 hover:border-[#333] transition-all justify-between ${
                    item.is_available ? 'border-[#222]' : 'border-dashed border-red-500/30 opacity-70 bg-red-950/5'
                  }`}
                >
                  <div className="flex gap-4 min-w-0">
                    {/* Item Avatar */}
                    <div className="w-16 h-16 rounded-xl bg-[#0A0A0A] border border-[#222] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsIcon className="w-6 h-6 text-muted" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={item.is_veg ? 'badge-veg w-3.5 h-3.5 rounded' : 'badge-nonveg w-3.5 h-3.5 rounded'} />
                        <h4 className="font-semibold text-sm text-foreground truncate">{item.name}</h4>
                      </div>
                      <p className="text-xs text-muted line-clamp-1">{item.description || 'No description'}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                        {cat && (
                          <span className="text-[10px] bg-[#222] text-muted px-2 py-0.5 rounded-full truncate max-w-[100px]">
                            📁 {cat.name}
                          </span>
                        )}
                        {linkedAddonCount > 0 && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            ⚡ {linkedAddonCount} Customizer(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-between items-end">
                    {/* Availability toggle */}
                    <button
                      onClick={() => toggleItemAvailability(item)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        item.is_available
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-non-veg/10 border-non-veg/30 text-non-veg'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Disabled'}
                    </button>

                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => openItemModal(item)}
                        className="p-1.5 rounded-lg border border-[#222] bg-[#0A0A0A] hover:text-accent hover:border-accent/30 text-muted transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg border border-[#222] bg-[#0A0A0A] hover:text-non-veg hover:border-non-veg/30 text-muted transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Categories List
        categories.length === 0 ? (
          <div className="py-16 text-center border border-[#222] rounded-3xl bg-[#141414]/30">
            <ListFilter className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No categories found</h3>
            <p className="text-xs text-muted mt-1">Create categories (like Appetizers, Mains, Drinks) to group menu items.</p>
          </div>
        ) : (
          <div className="max-w-lg space-y-2">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 flex justify-between items-center hover:border-[#333] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted font-mono">#{idx + 1}</span>
                  <span className="font-semibold text-sm text-foreground">{cat.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCategoryModal(cat)}
                    className="p-1.5 rounded-lg border border-[#222] bg-[#0A0A0A] hover:text-accent text-muted transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg border border-[#222] bg-[#0A0A0A] hover:text-non-veg text-muted transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#141414] border border-[#222] rounded-3xl p-6 shadow-2xl z-10">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="E.g., Starters, Pizzas, Desserts"
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-[#F5F5F5]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:brightness-110 text-white rounded-full py-2.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#222] hover:bg-[#222] text-xs font-semibold text-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENU ITEM MODAL */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsItemModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#222] rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4 flex-shrink-0">
              {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted pl-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="E.g., Double Cheese Burger"
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted pl-1">Base Price (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="₹0.00"
                      className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 pl-9 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted pl-1">Category</label>
                  <select
                    required
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Item Description</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Enter short description of the food item..."
                  rows={2}
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-2xl py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Photo Image URL</label>
                <input
                  type="url"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 items-center p-3 rounded-2xl bg-[#0A0A0A]/40 border border-[#222]">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted">
                  <input
                    type="checkbox"
                    checked={itemVeg}
                    onChange={(e) => setItemVeg(e.target.checked)}
                    className="w-4 h-4 accent-veg rounded border-[#333]"
                  />
                  Is Veg? 🌱
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded border-[#333]"
                  />
                  Is Available? ✅
                </label>
              </div>

              {/* Linking Addon Groups */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted pl-1 block">Link Addon Customizations</label>
                {addonGroups.length === 0 ? (
                  <p className="text-[10px] text-muted italic pl-1">
                    No custom addon groups created. Go to Addon panel first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1 no-scrollbar">
                    {addonGroups.map((group) => {
                      const isLinked = selectedAddonGroups.includes(group.id);

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleToggleAddonGroupSelect(group.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                            isLinked
                              ? 'bg-accent/15 border-accent text-foreground'
                              : 'bg-[#0A0A0A]/30 border-[#222] text-muted'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-white transition-all ${
                              isLinked ? 'bg-accent border-accent' : 'border-[#333]'
                            }`}
                          >
                            {isLinked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs truncate">{group.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#222]/80 mt-4 flex-shrink-0">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:brightness-110 text-white rounded-full py-2.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Menu Item
                </button>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#222] hover:bg-[#222] text-xs font-semibold text-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Small icon wrapper
function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
