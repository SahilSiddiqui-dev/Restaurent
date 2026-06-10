'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Layers, Check, X, ShieldAlert, IndianRupee } from 'lucide-react';
import { AddonGroup, AddonGroupItem } from '@/lib/queries';

export default function AddonsManagementPage() {
  const { restaurant } = useAdmin();

  // Lists State
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [addonItems, setAddonItems] = useState<AddonGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Form States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupRequired, setGroupRequired] = useState(false);
  const [minSelect, setMinSelect] = useState('0');
  const [maxSelect, setMaxSelect] = useState('1');
  const [selectionType, setSelectionType] = useState<'single' | 'multiple'>('single');

  // Addon Item Form States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AddonGroup | null>(null);
  const [editingItem, setEditingItem] = useState<AddonGroupItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);

  // Panel state to track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    if (!restaurant) return;
    try {
      setLoading(true);

      // Fetch groups
      const { data: groupData } = await supabase
        .from('addon_groups')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch all addon items linked to these groups
      const groupIds = (groupData || []).map((g) => g.id);
      const { data: itemData } = groupIds.length > 0
        ? await supabase
            .from('addon_group_items')
            .select('*')
            .in('addon_group_id', groupIds)
            .order('created_at', { ascending: true })
        : { data: [] };

      setGroups((groupData || []) as AddonGroup[]);
      setAddonItems((itemData || []) as AddonGroupItem[]);

      // Default expand all if first load
      if (Object.keys(expandedGroups).length === 0 && groupData) {
        const initialExpand: Record<string, boolean> = {};
        groupData.forEach((g) => {
          initialExpand[g.id] = true;
        });
        setExpandedGroups(initialExpand);
      }
    } catch (err) {
      console.error('Error fetching addons:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    fetchData();
  }, [restaurant, fetchData]);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // ADDON GROUP OPERATIONS
  const openGroupModal = (group: AddonGroup | null = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
      setGroupRequired(group.is_required);
      setMinSelect(group.min_select.toString());
      setMaxSelect(group.max_select.toString());
      setSelectionType(group.max_select === 1 ? 'single' : 'multiple');
    } else {
      setEditingGroup(null);
      setGroupName('');
      setGroupRequired(false);
      setMinSelect('0');
      setMaxSelect('1');
      setSelectionType('single');
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const minVal = groupRequired ? Math.max(1, Number(minSelect)) : 0;
    const maxVal = selectionType === 'single' ? 1 : Math.max(1, Number(maxSelect));

    try {
      if (editingGroup) {
        // Update
        const { error } = await supabase
          .from('addon_groups')
          .update({
            name: groupName,
            is_required: groupRequired,
            min_select: minVal,
            max_select: maxVal,
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('addon_groups').insert({
          name: groupName,
          is_required: groupRequired,
          min_select: minVal,
          max_select: maxVal,
        });

        if (error) throw error;
      }

      setIsGroupModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error saving addon group: ${err.message}`);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon group? All options inside it will be permanently deleted.')) return;

    try {
      const { error } = await supabase.from('addon_groups').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Error deleting group: ${err.message}`);
    }
  };

  // ADDON ITEMS OPERATIONS
  const openItemModal = (group: AddonGroup, item: AddonGroupItem | null = null) => {
    setSelectedGroup(group);
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemPrice(item.extra_price.toString());
      setItemAvailable(item.is_available);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemPrice('0');
      setItemAvailable(true);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      if (editingItem) {
        // Update item
        const { error } = await supabase
          .from('addon_group_items')
          .update({
            name: itemName,
            extra_price: Number(itemPrice),
            is_available: itemAvailable,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create item
        const { error } = await supabase.from('addon_group_items').insert({
          addon_group_id: selectedGroup.id,
          name: itemName,
          extra_price: Number(itemPrice),
          is_available: itemAvailable,
        });

        if (error) throw error;
      }

      setIsItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error saving addon: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const { error } = await supabase.from('addon_group_items').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Error deleting option: ${err.message}`);
    }
  };

  const toggleItemAvailability = async (item: AddonGroupItem) => {
    const nextVal = !item.is_available;
    try {
      const { error } = await supabase
        .from('addon_group_items')
        .update({ is_available: nextVal })
        .eq('id', item.id);

      if (error) throw error;

      // Optimistic update
      setAddonItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: nextVal } : i))
      );
    } catch (err: any) {
      alert(`Error updating option availability: ${err.message}`);
    }
  };

  if (!restaurant) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Addon Customizations</h2>
          <p className="text-xs text-muted">Manage extra choices, sides, toppings, and size variables</p>
        </div>

        <button
          onClick={() => openGroupModal()}
          className="bg-accent hover:brightness-110 text-white font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-accent/10 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Addon Group
        </button>
      </div>

      {/* Main Container */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-t-2 border-accent animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted">Refreshing addon structures...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center border border-[#222] rounded-3xl bg-[#141414]/30">
          <Layers className="w-10 h-10 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No addon groups configured</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Addon groups let customers customize their orders (e.g. &quot;Choose Spice Level&quot;, &quot;Add Extra Toppings&quot;).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isExpanded = !!expandedGroups[group.id];
            const groupOptions = addonItems.filter((i) => i.addon_group_id === group.id);

            return (
              <div
                key={group.id}
                className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Accordion Header */}
                <div
                  className="p-4 sm:p-5 flex justify-between items-center bg-[#181818]/60 cursor-pointer select-none"
                  onClick={() => toggleGroupExpand(group.id)}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {group.name}
                        {group.is_required && (
                          <span className="text-[9px] bg-accent/10 border border-accent/20 text-accent font-bold px-1.5 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-muted mt-0.5">
                        Rules: {group.max_select === 1 ? 'Single selection' : `Multi selection (up to ${group.max_select})`}
                      </p>
                    </div>
                  </div>

                  {/* Actions & expand icon */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openGroupModal(group)}
                      className="p-1.5 rounded-lg border border-[#333] hover:text-accent hover:border-accent/30 text-muted transition-colors cursor-pointer bg-[#0A0A0A]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 rounded-lg border border-[#333] hover:text-non-veg hover:border-non-veg/30 text-muted transition-colors cursor-pointer bg-[#0A0A0A]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div
                      onClick={() => toggleGroupExpand(group.id)}
                      className="p-1 rounded-full text-muted hover:text-foreground cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#222]/80 bg-[#0A0A0A]/20 space-y-4">
                    {/* Addon Items Grid */}
                    {groupOptions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted border border-dashed border-[#222] rounded-xl bg-[#0A0A0A]/40 flex flex-col justify-center items-center gap-2">
                        <span>No options created inside this group.</span>
                        <button
                          onClick={() => openItemModal(group)}
                          className="text-accent font-semibold hover:underline flex items-center gap-0.5 cursor-pointer text-[10px]"
                        >
                          <Plus className="w-3 h-3" /> Add Option
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Group Options</span>
                          <button
                            onClick={() => openItemModal(group)}
                            className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Option
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {groupOptions.map((option) => (
                            <div
                              key={option.id}
                              className={`p-3 rounded-xl border flex justify-between items-center transition-all bg-[#0A0A0A]/50 ${
                                option.is_available ? 'border-[#222]' : 'border-red-500/10 opacity-70'
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-xs text-foreground">{option.name}</p>
                                <span className="text-[10px] text-accent font-bold mt-0.5 block">
                                  {Number(option.extra_price) > 0 ? `+ ₹${option.extra_price}` : 'Free'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleItemAvailability(option)}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                    option.is_available
                                      ? 'bg-success/15 border-success/35 text-success'
                                      : 'bg-non-veg/15 border-non-veg/35 text-non-veg'
                                  }`}
                                >
                                  {option.is_available ? 'Available' : 'Disabled'}
                                </button>
                                <button
                                  onClick={() => openItemModal(group, option)}
                                  className="p-1 rounded hover:text-accent text-muted transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(option.id)}
                                  className="p-1 rounded hover:text-non-veg text-muted transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADDON GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsGroupModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#141414] border border-[#222] rounded-3xl p-6 shadow-2xl z-10">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
              {editingGroup ? 'Edit Addon Group' : 'Create Addon Group'}
            </h3>
            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Group Title</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="E.g., Extra Toppings, Choose Size"
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                />
              </div>

              {/* Selection type radio buttons */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Selection Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionType('single')}
                    className={`py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                      selectionType === 'single'
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-[#0A0A0A]/30 border-[#222] text-muted'
                    }`}
                  >
                    Single Choice (Radio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionType('multiple')}
                    className={`py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                      selectionType === 'multiple'
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-[#0A0A0A]/30 border-[#222] text-muted'
                    }`}
                  >
                    Multiple Choice (Checkbox)
                  </button>
                </div>
              </div>

              {/* Required toggle */}
              <div className="flex gap-2 items-center p-3 rounded-2xl bg-[#0A0A0A]/40 border border-[#222]">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted select-none">
                  <input
                    type="checkbox"
                    checked={groupRequired}
                    onChange={(e) => setGroupRequired(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded border-[#333]"
                  />
                  Is this customization required? ⚠️
                </label>
              </div>

              {/* Selection limit bounds */}
              {selectionType === 'multiple' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#0A0A0A]/40 border border-[#222]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted pl-1">Min Selections</label>
                    <input
                      type="number"
                      min="0"
                      value={minSelect}
                      onChange={(e) => setMinSelect(e.target.value)}
                      className="w-full bg-[#141414] border border-[#222] rounded-lg py-1.5 px-3 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted pl-1">Max Selections</label>
                    <input
                      type="number"
                      min="1"
                      value={maxSelect}
                      onChange={(e) => setMaxSelect(e.target.value)}
                      className="w-full bg-[#141414] border border-[#222] rounded-lg py-1.5 px-3 text-xs text-foreground"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:brightness-110 text-white rounded-full py-2.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Group
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#222] hover:bg-[#222] text-xs font-semibold text-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADDON ITEM OPTION MODAL */}
      {isItemModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsItemModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#141414] border border-[#222] rounded-3xl p-6 shadow-2xl z-10">
            <h3 className="text-md font-serif font-semibold text-foreground mb-1">
              {editingItem ? 'Edit Option' : 'Add Option'}
            </h3>
            <p className="text-[10px] text-muted mb-4">Adding choice to: {selectedGroup.name}</p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Option Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="E.g., Extra Cheese, Green Chutney"
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted pl-1">Extra Cost (₹)</label>
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

              {/* Available toggle */}
              <div className="flex gap-2 items-center p-3 rounded-2xl bg-[#0A0A0A]/40 border border-[#222]">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted select-none">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded border-[#333]"
                  />
                  Is this option currently available?
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:brightness-110 text-white rounded-full py-2.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Option
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
