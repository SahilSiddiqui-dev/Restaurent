'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context';
import { supabase } from '@/lib/supabase';
import { Clock, Phone, MapPin, Check, Truck, Flame, X, CheckSquare, MessageSquare } from 'lucide-react';

interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat?: number;
  customer_lng?: number;
  items: {
    id: string;
    name: string;
    price: number;
    qty: number;
    addons: { name: string; extra_price: number }[];
  }[];
  addons_total: number;
  subtotal: number;
  total_amount: number;
  special_instructions?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
}

type TabType = 'pending' | 'active' | 'completed' | 'cancelled';

export default function DashboardPage() {
  const { restaurant } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const fetchOrders = useCallback(async () => {
    if (!restaurant) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders((data || []) as Order[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  // Set up Realtime listener & fetch initially
  useEffect(() => {
    if (!restaurant) return;

    fetchOrders();

    // Subscribe to changes in the orders table
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Realtime order update received:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert(`Failed to update status: ${error.message}`);
      } else {
        // Optimistic UI update
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'active') {
      return ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
    }
    if (activeTab === 'completed') return order.status === 'delivered';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return false;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'confirmed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
      case 'preparing':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-500';
      case 'out_for_delivery':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500';
      case 'delivered':
        return 'bg-success/10 border-success/30 text-success';
      case 'cancelled':
        return 'bg-non-veg/10 border-non-veg/30 text-non-veg';
      default:
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-500';
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!restaurant) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Incoming Orders</h2>
          <p className="text-xs text-muted">Manage realtime pipeline orders for {restaurant.name}</p>
        </div>

        {/* Realtime Status Beacon */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#222] text-[10px] font-semibold text-success w-fit">
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          Realtime Connected
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#222]/80 gap-1 overflow-x-auto no-scrollbar">
        {(['pending', 'active', 'completed', 'cancelled'] as TabType[]).map((tab) => {
          const tabCount = orders.filter((o) => {
            if (tab === 'pending') return o.status === 'pending';
            if (tab === 'active') return ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status);
            if (tab === 'completed') return o.status === 'delivered';
            return o.status === 'cancelled';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold border-b-2 capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab} ({tabCount})
            </button>
          );
        })}
      </div>

      {/* Orders Grid/List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-t-2 border-accent animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted">Refreshing orders list...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center border border-[#222] rounded-3xl bg-[#141414]/30">
          <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground capitalize">No {activeTab} orders</h3>
          <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
            When customers place orders on your menu site, they will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const mapsUrl = order.customer_lat
              ? `https://www.google.com/maps/search/?api=1&query=${order.customer_lat},${order.customer_lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`;

            // Formulate WhatsApp order notification string for communication
            const orderSummaryText = order.items
              .map((i) => `${i.qty}x ${i.name}`)
              .join(', ');
            const message = `Hello ${order.customer_name}, this is ${restaurant.name}. We have updated your order status to "${order.status.toUpperCase()}". Thank you for ordering!`;
            const whatsappUrl = `https://wa.me/91${order.customer_phone}?text=${encodeURIComponent(message)}`;

            return (
              <div
                key={order.id}
                className="bg-[#141414] border border-[#222] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#333] transition-all"
              >
                {/* Card Top: Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{order.customer_name}</h4>
                      <p className="text-[10px] text-muted mt-0.5">{formatTime(order.created_at)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full capitalize ${getStatusBadgeClass(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Customer Phone & Address */}
                  <div className="space-y-1.5 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      <a href={`tel:${order.customer_phone}`} className="hover:underline hover:text-foreground">
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-accent mt-0.5" />
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline hover:text-foreground line-clamp-2"
                      >
                        {order.customer_address} 📍
                      </a>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="border-t border-b border-[#222]/60 py-3 my-2 space-y-2 text-xs">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <span className="font-bold text-foreground">{item.qty}x</span> {item.name}
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-[10px] text-muted italic ml-4">
                              + {item.addons.map((a) => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="text-muted font-medium">₹{(Number(item.price) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Instructions */}
                  {order.special_instructions && (
                    <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/10 text-[11px] text-accent">
                      💬 <strong>Instructions:</strong> {order.special_instructions}
                    </div>
                  )}

                  {/* Grand total price breakdown */}
                  <div className="flex justify-between items-center text-xs pt-1.5">
                    <span className="text-muted">Total Amount Paid</span>
                    <span className="font-bold text-sm text-accent">₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Actions pipeline: Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#222]/40">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="flex-1 bg-accent hover:brightness-110 text-white text-[11px] font-semibold py-2.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="bg-transparent border border-non-veg text-non-veg hover:bg-non-veg/5 text-[11px] font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-accent hover:brightness-110 text-white text-[11px] font-semibold py-2.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Start Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                      className="flex-1 bg-accent hover:brightness-110 text-white text-[11px] font-semibold py-2.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Delivery
                    </button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 bg-success hover:brightness-115 text-white text-[11px] font-semibold py-2.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Mark Delivered
                    </button>
                  )}

                  {/* Customer WhatsApp helper icon */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 bg-zinc-800 border border-zinc-700 hover:text-success hover:border-success/30 hover:bg-success/5 rounded-full flex items-center justify-center text-muted transition-colors cursor-pointer"
                    title="Send WhatsApp status notification"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
