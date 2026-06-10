'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';

// Google Maps script loader helper
const MAPS_SCRIPT_ID = 'google-maps-api-script';
const loadGoogleMapsScript = (callback: () => void) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API Key missing. Running in simulated demo mode.');
    callback();
    return;
  }

  if (document.getElementById(MAPS_SCRIPT_ID)) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.id = MAPS_SCRIPT_ID;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.onload = () => callback();
  script.onerror = () => {
    console.error('Failed to load Google Maps script. Falling back to demo mode.');
    callback();
  };
  document.head.appendChild(script);
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart } = useCartStore();

  // Restaurant details fetched on mount
  const [restaurant, setRestaurant] = useState<any>(null);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // UI States
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [redirected, setRedirected] = useState(false);

  // Refs
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const { subtotal, addonsTotal, total, count } = getTotals();

  // Load Google Maps script and setup Autocomplete + Fetch single restaurant details
  useEffect(() => {
    if (items.length === 0 && !isSuccess) {
      router.push('/');
      return;
    }

    // Fetch restaurant metadata
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.restaurant) {
          setRestaurant(data.restaurant);
        }
      })
      .catch((err) => console.error('Error fetching restaurant details:', err));

    loadGoogleMapsScript(() => {
      setIsMapsLoaded(true);
      if (typeof window !== 'undefined' && (window as any).google) {
        setupAutocomplete();
      }
    });
  }, []);

  // Redirect countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && whatsappUrl && countdown > 0 && !redirected) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && whatsappUrl && countdown === 0 && !redirected) {
      setRedirected(true);
      window.location.href = whatsappUrl;
    }
    return () => clearTimeout(timer);
  }, [isSuccess, whatsappUrl, countdown, redirected]);

  const handleWhatsAppManualClick = () => {
    setRedirected(true);
    window.open(whatsappUrl, '_blank');
  };

  const setupAutocomplete = () => {
    if (!autocompleteInputRef.current || !(window as any).google) return;

    autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'IN' },
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || '';

        setAddress(formattedAddress);
        setCoords({ lat, lng });
        renderMap(lat, lng);
      }
    });
  };

  const renderMap = (lat: number, lng: number) => {
    if (!mapContainerRef.current || !(window as any).google) return;

    const google = (window as any).google;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 16,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#212121' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        ],
        disableDefaultUI: true,
      });

      markerRef.current = new google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      markerRef.current.addListener('dragend', async () => {
        const position = markerRef.current.getPosition();
        const newLat = position.lat();
        const newLng = position.lng();
        setCoords({ lat: newLat, lng: newLng });
        await handleReverseGeocode(newLat, newLng);
      });
    } else {
      const position = { lat, lng };
      mapRef.current.setCenter(position);
      markerRef.current.setPosition(position);
    }
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    if (!(window as any).google) return;
    const geocoder = new (window as any).google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        setAddress(response.results[0].formatted_address);
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    }
  };

  // Geolocate customer
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if ((window as any).google) {
          await handleReverseGeocode(latitude, longitude);
          renderMap(latitude, longitude);
        } else {
          // Fallback mockup reverse geocoding
          setTimeout(() => {
            const cityName = restaurant?.city || 'Mumbai';
            setAddress(`Gourmet Lane, Near Main Square, ${cityName.toUpperCase()}`);
            setIsLocating(false);
          }, 1000);
          return;
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Fallback for demo
        setTimeout(() => {
          const cityName = restaurant?.city || 'Mumbai';
          setAddress(`Gourmet Lane, Near Main Square, ${cityName.toUpperCase()}`);
          setCoords({ lat: 19.076, lng: 72.877 }); // Mumbai coords fallback
          setIsLocating(false);
        }, 1000);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const validatePhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    setPhone(clean);
    if (clean.length !== 10) {
      setPhoneError('Contact number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit number.');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      customerLat: coords?.lat,
      customerLng: coords?.lng,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        addons: i.addons.map((a) => ({ name: a.name, extra_price: a.extra_price })),
      })),
      addonsTotal,
      subtotal,
      totalAmount: total,
      specialInstructions: instructions,
    };

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.whatsappUrl) {
          setWhatsappUrl(data.whatsappUrl);
        }
        setIsSuccess(true);
        clearCart();
      } else {
        alert('Something went wrong. Please try placing the order again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pb-12 font-sans px-4">
      {/* Top Header */}
      <header className="max-w-md mx-auto py-6 flex items-center justify-between border-b border-[#222]">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs text-muted hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <span className="text-sm font-serif font-semibold tracking-wide">Checkout</span>
        <div className="w-16" /> {/* Spacer */}
      </header>

      {/* Main Checkout View */}
      <main className="max-w-md mx-auto mt-6">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="checkout-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Step Progress Bar */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                  <span className="w-5 h-5 rounded-full bg-[#222] flex items-center justify-center font-bold">1</span>
                  <span>Menu</span>
                </div>
                <div className="w-8 h-[1px] bg-[#222]" />
                <div className="flex items-center gap-1.5 text-muted">
                  <span className="w-5 h-5 rounded-full bg-[#222] flex items-center justify-center font-bold">2</span>
                  <span>Cart</span>
                </div>
                <div className="w-8 h-[1px] bg-[#222]" />
                <div className="flex items-center gap-1.5 text-accent font-semibold">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-bold">3</span>
                  <span>Order</span>
                </div>
              </div>

              {/* Order Summary Dropdown */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="w-full p-4 flex justify-between items-center text-sm font-semibold hover:bg-[#1C1C1C] transition-colors"
                >
                  <div className="flex items-center gap-2 text-[#F5F5F5]">
                    <ShoppingBag className="w-4 h-4 text-accent" />
                    <span>Order Summary ({count} items)</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent font-bold">
                    <span>₹{total.toFixed(2)}</span>
                    {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isSummaryExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-[#222] bg-[#0A0A0A]/40 text-xs text-muted"
                    >
                      <div className="p-4 space-y-3">
                        {items.map((item) => (
                          <div key={item.cartId} className="flex justify-between items-start gap-4">
                            <div>
                              <span className="font-semibold text-foreground">{item.qty}x</span> {item.name}
                              {item.addons.length > 0 && (
                                <p className="text-[10px] text-muted italic mt-0.5">
                                  {item.addons.map((a) => a.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <span>₹{((item.price + item.addons.reduce((s, a) => s + a.extra_price, 0)) * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-[#222] pt-3 mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          {addonsTotal > 0 && (
                            <div className="flex justify-between">
                              <span>Customizations</span>
                              <span>₹{addonsTotal.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-foreground text-sm pt-1.5">
                            <span>Grand Total</span>
                            <span className="text-accent">₹{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted pl-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#141414] border border-[#222] rounded-full py-3 px-5 text-sm placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted pl-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => validatePhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className={`w-full bg-[#141414] border rounded-full py-3 px-5 text-sm placeholder:text-muted focus:ring-1 focus:ring-accent transition-all text-foreground ${
                      phoneError ? 'border-non-veg focus:border-non-veg' : 'border-[#222] focus:border-accent'
                    }`}
                  />
                  {phoneError && <p className="text-[10px] text-non-veg pl-2">{phoneError}</p>}
                </div>

                {/* Geolocation section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-xs font-semibold text-muted">Delivery Address</label>
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isLocating}
                      className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isLocating ? 'Locating...' : 'Use My Location 📍'}
                    </button>
                  </div>

                  {/* Google Maps Container */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-40 rounded-2xl bg-[#141414] border border-[#222] overflow-hidden flex items-center justify-center relative"
                  >
                    {!coords && (
                      <div className="text-center p-4">
                        <MapPin className="w-8 h-8 text-accent mx-auto mb-2 animate-bounce" />
                        <p className="text-[10px] text-muted max-w-[200px]">
                          Click &quot;Use My Location&quot; or type address below to drop delivery pin.
                        </p>
                      </div>
                    )}
                    {coords && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                      /* Mock Map preview if API key not present */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] to-[#141414] p-4 text-center">
                        <MapPin className="w-8 h-8 text-accent animate-bounce" />
                        <span className="text-xs font-semibold mt-1">Delivery Pin Dropped!</span>
                        <span className="text-[10px] text-muted mt-0.5">Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</span>
                        <span className="text-[9px] text-accent mt-2 px-2 py-0.5 rounded bg-accent/10 border border-accent/20">Demo Map Placeholder</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    ref={autocompleteInputRef}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter flat/floor/landmark/street details"
                    className="w-full bg-[#141414] border border-[#222] rounded-full py-3 px-5 text-sm placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground"
                  />
                  <p className="text-[9px] text-muted pl-2">
                    We will use this address to coordinate your delivery.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted pl-1">Special Instructions (Optional)</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="E.g., Make it extra spicy, Ring the doorbell, Leave at the door"
                    rows={2}
                    className="w-full bg-[#141414] border border-[#222] rounded-2xl py-3 px-5 text-sm placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none text-foreground"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-accent hover:brightness-110 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all cursor-pointer disabled:opacity-50 mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>Place My Order 🎉</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            /* ORDER SUCCESS SCREEN */
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center space-y-6 bg-[#141414] border border-[#222] rounded-3xl p-6 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-success/15 border border-success/35 text-success rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-foreground">We&apos;re on it! 🔥</h2>
                <p className="text-sm text-muted max-w-[280px] mx-auto leading-relaxed">
                  Your order has been saved. We are redirecting you to WhatsApp to send the order details to the shop!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#222] text-xs text-left max-w-[320px] mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Customer Name:</span>
                  <span className="font-semibold text-foreground">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Order Total:</span>
                  <span className="font-bold text-accent">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery Address:</span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[180px]">{address}</span>
                </div>
              </div>

              {whatsappUrl && (
                <div className="space-y-3 px-4 max-w-[320px] mx-auto">
                  {countdown > 0 ? (
                    <p className="text-[11px] text-muted">
                      Redirecting you to WhatsApp in <span className="text-accent font-bold">{countdown}s</span>...
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted">
                      Opening WhatsApp... If it didn&apos;t open, please click below.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleWhatsAppManualClick}
                    className="w-full h-11 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer text-xs uppercase tracking-wide border-0"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.007c5.528 0 10.026-4.493 10.029-10.02.001-2.678-1.03-5.195-2.903-7.07C17.327 1.649 14.82 .619 12.01.619c-5.53 0-10.028 4.497-10.032 10.027-.001 1.93.504 3.818 1.461 5.418L1.882 22.03l6.093-1.597.672.411zm11.367-7.46c-.302-.15-1.78-.879-2.056-.979-.277-.1-.479-.15-.68.15-.2.3-.775.979-.951 1.178-.176.2-.351.224-.652.075-1.127-.565-1.957-1.042-2.738-1.782-.622-.59-.722-.51-.83-.652-.109-.142-.012-.22-.1-.371-.089-.15-.089-.286-.044-.386.044-.1.2-.3.3-.45.1-.15.134-.25.201-.4.067-.15.034-.286-.017-.386-.05-.1-.479-1.156-.657-1.583-.173-.418-.364-.361-.502-.368-.13-.006-.279-.007-.428-.007-.15 0-.395.056-.602.282-.206.226-.787.77-1.042 1.316-.255.545-.5 1.074-.753 1.583-.553 1.112-1.398 2.182-2.296 2.9-.899.718-1.78 1.22-2.88 1.637l-1.03.39c-.58.219-1.085.342-1.503.303-.467-.044-1.436-.587-1.638-1.156-.2-.568-.2-1.055-.14-1.156.06-.1.226-.15.528-.3z" />
                    </svg>
                    <span>Send details via WhatsApp</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="bg-transparent hover:bg-[#1C1C1C] border border-[#222] text-[#F5F5F5] text-xs font-semibold px-6 py-2.5 rounded-full transition-all cursor-pointer"
              >
                Back to Menu
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
