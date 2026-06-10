'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Invalid login credentials.');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative subtle background gradient */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4 border border-accent/20">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-foreground">CityBite Admin</h1>
          <p className="text-xs text-muted">Sign in to manage your restaurant menu and orders</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-non-veg/10 border border-non-veg/30 text-non-veg text-xs font-semibold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g., admin@burgerhub.com"
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-3 pl-11 pr-5 text-sm placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0A0A] border border-[#222] rounded-full py-3 pl-11 pr-5 text-sm placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent hover:brightness-110 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all cursor-pointer disabled:opacity-50 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] text-muted">
            Need an account? Contact the SaaS city representative for onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
