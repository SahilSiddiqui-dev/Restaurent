'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Palette, ShieldAlert } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Appetite Orange-Red', hex: '#FF4D00' },
  { name: 'Warm Amber', hex: '#FFB347' },
  { name: 'Classic Red', hex: '#EF4444' },
  { name: 'Healthy Green', hex: '#22C55E' },
  { name: 'Cozy Indigo', hex: '#6366F1' },
  { name: 'Minimal Soft White', hex: '#F5F5F5' },
];

export default function SettingsPage() {
  const { restaurant, refreshRestaurant } = useAdmin();

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#FF4D00');
  const [isActive, setIsActive] = useState(true);

  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hydrate form with current restaurant details
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setPhone(restaurant.phone);
      setAddress(restaurant.address);
      setLogoUrl(restaurant.logo_url || '');
      setCoverUrl(restaurant.cover_image_url || '');
      setThemeColor(restaurant.theme_color || '#FF4D00');
      setIsActive(restaurant.is_active);
    }
  }, [restaurant]);

  if (!restaurant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('restaurant_settings')
        .update({
          name,
          phone,
          address,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl || null,
          theme_color: themeColor,
          is_active: isActive,
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      await refreshRestaurant();
      setSuccessMessage('Restaurant settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to update settings: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-[#222] pb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">Restaurant Profile</h2>
        <p className="text-xs text-muted">Update your brand details, theme color, and operational status</p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold">
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-non-veg/15 border border-non-veg/30 text-non-veg text-xs font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core details card */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted pl-1">Restaurant Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Burger Hub"
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted pl-1">Contact Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="E.g., 9876543210"
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted pl-1">Street Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="E.g., 123 Gourmet St, Bandra West"
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Media URLs Card */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Design Media (Images)</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted pl-1">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted pl-1">Cover Header Image URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-2.5 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Branding & Palette Card */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-accent" />
            Branding Palette Accent Color
          </h3>

          <div className="space-y-4">
            {/* Color Swatch Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = themeColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setThemeColor(preset.hex)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[9px] font-semibold transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-[#222] bg-[#0A0A0A]/30 text-muted hover:border-[#333]'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: preset.hex }}
                      className="w-5 h-5 rounded-full border border-white/10"
                    />
                    <span className="truncate w-full text-center">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Hex code picker */}
            <div className="flex gap-2 items-center bg-[#0A0A0A] border border-[#222] rounded-full py-1.5 pl-4 pr-1.5 w-fit">
              <span className="text-xs font-semibold text-muted">Custom Hex:</span>
              <input
                type="text"
                pattern="^#[0-9A-Fa-f]{6}$"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#FF4D00"
                className="bg-[#141414] border border-[#222] rounded-full px-3 py-1 text-xs text-foreground font-mono w-24 text-center focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Operational Status */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Operational Status</h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A]/40 border border-[#222]">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Accepting Customer Orders</p>
              <p className="text-[10px] text-muted">Toggle off to mark your restaurant closed temporarily</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`text-xs font-bold px-4 py-2 rounded-full border transition-all cursor-pointer ${
                isActive
                  ? 'bg-success/15 border-success/35 text-success'
                  : 'bg-non-veg/15 border-non-veg/35 text-non-veg'
              }`}
            >
              {isActive ? 'Restaurant Open 🟢' : 'Restaurant Closed 🔴'}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-accent hover:brightness-110 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
