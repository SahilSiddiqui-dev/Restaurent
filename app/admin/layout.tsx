'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Utensils, Settings, LogOut, ChevronRight, Menu, X, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Restaurant } from '@/lib/queries';
import { AdminContext } from './context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch the restaurant owned by the user
  const fetchRestaurant = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching admin restaurant:', error);
      } else if (data) {
        setRestaurant(data as Restaurant);
      } else {
        setRestaurant(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshRestaurant = async () => {
    if (user) {
      await fetchRestaurant(user.id);
    }
  };

  useEffect(() => {
    // 1. Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        await fetchRestaurant(session.user.id);
        
        // If logged in and on login page, redirect to dashboard
        if (pathname === '/admin/login') {
          router.push('/admin/dashboard');
        }
      } else {
        setUser(null);
        setRestaurant(null);
        
        // If not on login page, redirect to login
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
      setLoading(false);
    };

    checkSession();

    // 2. Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchRestaurant(session.user.id);
        if (pathname === '/admin/login') {
          router.push('/admin/dashboard');
        }
      } else {
        setUser(null);
        setRestaurant(null);
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Skip rendering sidebar layout for Login page
  if (pathname === '/admin/login') {
    return (
      <AdminContext.Provider value={{ user, restaurant, loading, refreshRestaurant }}>
        {children}
      </AdminContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-t-2 border-accent animate-spin" />
        <p className="text-muted text-xs">Verifying credentials...</p>
      </div>
    );
  }

  // If not logged in and not on login page, display redirect spinner
  if (!user && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-t-2 border-accent animate-spin" />
        <p className="text-muted text-xs">Redirecting to login...</p>
      </div>
    );
  }

  // If authenticated but owns no restaurant
  if (user && !restaurant) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#141414] border border-[#222] rounded-3xl p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">No Restaurant Configured</h2>
            <p className="text-sm text-muted">
              Your account ({user.email}) is successfully authenticated, but there is no restaurant associated with it in our database.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222] text-left text-xs text-muted space-y-1.5">
            <p><strong>To resolve this:</strong></p>
            <p>1. Insert your user ID into the `owner_id` column of your restaurant row in the database.</p>
            <p>2. Your user ID: <code className="text-accent bg-accent/5 px-1 py-0.5 rounded font-mono">{user.id}</code></p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-[#222] hover:bg-[#333] text-foreground font-semibold text-sm py-3 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Orders Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Menu Settings', href: '/admin/menu', icon: Utensils },
    { name: 'Addon Customizations', href: '/admin/addons', icon: Layers },
    { name: 'Restaurant Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <AdminContext.Provider value={{ user, restaurant, loading, refreshRestaurant }}>
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col md:flex-row">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-[#141414] border-b border-[#222] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            {restaurant?.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="logo"
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="font-semibold text-sm truncate max-w-[150px]">
              {restaurant?.name} Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded bg-[#0A0A0A] border border-[#222] text-muted hover:text-foreground"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:relative md:flex w-64 bg-[#141414] border-r border-[#222] flex-col justify-between z-30 transition-transform duration-300 ease-in-out h-full md:h-screen sticky top-0`}
        >
          <div className="p-6 space-y-8 flex-1 flex flex-col justify-between">
            {/* Top Logo Brand */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {restaurant?.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt="logo"
                    className="w-10 h-10 rounded-full object-cover border border-[#222]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white">
                    {restaurant?.name ? restaurant.name.substring(0, 1) : ''}
                  </div>
                )}
                <div className="truncate">
                  <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
                    {restaurant?.name}
                  </h3>
                  <span className="text-[10px] text-muted capitalize">
                    {restaurant?.city} (SaaS Client)
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-accent/10 text-accent border-l-4 border-accent pl-3'
                          : 'text-muted hover:text-foreground hover:bg-[#0A0A0A]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 opacity-60 ${isActive ? 'text-accent' : ''}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Footer User Info */}
            <div className="border-t border-[#222]/80 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-xs font-bold font-mono">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : ''}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                  <span className="text-[10px] text-muted">Authorized Admin</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0A0A0A] border border-[#222] hover:bg-non-veg/5 hover:border-non-veg/30 hover:text-non-veg text-xs font-semibold text-muted transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile navigation */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}

        {/* Page Main Content Area */}
        <main className="flex-1 min-h-screen overflow-y-auto p-4 sm:p-8 md:p-10 no-scrollbar max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AdminContext.Provider>
  );
}
