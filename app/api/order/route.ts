import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatWhatsAppMessage, sendWhatsAppNotification } from '@/lib/notifications';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerLat,
      customerLng,
      items,
      addonsTotal,
      subtotal,
      totalAmount,
      specialInstructions,
    } = body;

    // Helper to escape HTML and prevent XSS injections
    const sanitizeInput = (text: any): string => {
      if (typeof text !== 'string') return '';
      return text
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    // 1. Validate Input Types and Constraints
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (customerName.length > 100) {
      return NextResponse.json({ error: 'Customer name must be less than 100 characters.' }, { status: 400 });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!customerPhone || typeof customerPhone !== 'string' || !phoneRegex.test(customerPhone.trim())) {
      return NextResponse.json({ error: 'Valid 10-digit customer phone number is required.' }, { status: 400 });
    }

    if (!customerAddress || typeof customerAddress !== 'string' || customerAddress.trim().length === 0) {
      return NextResponse.json({ error: 'Customer address is required.' }, { status: 400 });
    }
    if (customerAddress.length > 500) {
      return NextResponse.json({ error: 'Customer address must be less than 500 characters.' }, { status: 400 });
    }

    if (specialInstructions && (typeof specialInstructions !== 'string' || specialInstructions.length > 500)) {
      return NextResponse.json({ error: 'Special instructions must be less than 500 characters.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }

    // Validate prices
    const parsedSubtotal = Number(subtotal);
    const parsedAddonsTotal = Number(addonsTotal);
    const parsedTotalAmount = Number(totalAmount);

    if (isNaN(parsedSubtotal) || parsedSubtotal < 0 ||
        isNaN(parsedAddonsTotal) || parsedAddonsTotal < 0 ||
        isNaN(parsedTotalAmount) || parsedTotalAmount < 0) {
      return NextResponse.json({ error: 'Invalid numeric price amount inputs.' }, { status: 400 });
    }

    // 2. Sanitize payload fields
    const sanitizedName = sanitizeInput(customerName);
    const sanitizedPhone = customerPhone.trim();
    const sanitizedAddress = sanitizeInput(customerAddress);
    const sanitizedInstructions = specialInstructions ? sanitizeInput(specialInstructions) : undefined;

    const sanitizedItems = items.map((item: any) => {
      return {
        id: sanitizeInput(item.id),
        name: sanitizeInput(item.name),
        price: Math.max(0, Number(item.price) || 0),
        qty: Math.max(1, Math.min(100, Number(item.qty) || 1)),
        addons: Array.isArray(item.addons)
          ? item.addons.map((a: any) => ({
              name: sanitizeInput(a.name),
              extra_price: Math.max(0, Number(a.extra_price) || 0),
            }))
          : [],
      };
    });

    // 3. Resolve first restaurant details (since it's a single restaurant site)
    const { data: restaurant, error: rError } = await supabase
      .from('restaurant_settings')
      .select('id, name, phone')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (rError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant configuration not found' }, { status: 404 });
    }

    // 4. Generate order ID and insert order details into database
    const orderId = crypto.randomUUID();
    const { error: oError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        customer_name: sanitizedName,
        customer_phone: sanitizedPhone,
        customer_address: sanitizedAddress,
        customer_lat: typeof customerLat === 'number' ? customerLat : null,
        customer_lng: typeof customerLng === 'number' ? customerLng : null,
        items: sanitizedItems,
        addons_total: parsedAddonsTotal,
        subtotal: parsedSubtotal,
        total_amount: parsedTotalAmount,
        special_instructions: sanitizedInstructions || null,
        status: 'pending',
      });

    if (oError) {
      console.error('Database insert order error:', oError);
      return NextResponse.json({ error: 'Failed to save order to database' }, { status: 500 });
    }

    // 5. Format and dispatch notification to owner
    const messageText = formatWhatsAppMessage({
      orderId: orderId,
      restaurantName: restaurant.name,
      customerName: sanitizedName,
      customerPhone: sanitizedPhone,
      customerAddress: sanitizedAddress,
      customerLat: typeof customerLat === 'number' ? customerLat : undefined,
      customerLng: typeof customerLng === 'number' ? customerLng : undefined,
      items: sanitizedItems,
      specialInstructions: sanitizedInstructions,
      subtotal: parsedSubtotal,
      addonsTotal: parsedAddonsTotal,
      totalAmount: parsedTotalAmount,
    });

    // Send WhatsApp notification to the restaurant's phone number
    await sendWhatsAppNotification(restaurant.phone, messageText);

    // Build the wa.me client URL for redirecting the customer
    const cleanPhone = restaurant.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({ success: true, order: { id: orderId }, whatsappUrl });
  } catch (error) {
    console.error('API order placement error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
