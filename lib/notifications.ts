export interface OrderNotificationData {
  orderId?: string;
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  items: {
    name: string;
    qty: number;
    price: number;
    addons: { name: string; extra_price: number }[];
  }[];
  specialInstructions?: string;
  subtotal: number;
  addonsTotal: number;
  totalAmount: number;
}

export function formatWhatsAppMessage(data: OrderNotificationData): string {
  let itemsList = '';
  data.items.forEach((item) => {
    itemsList += `• *${item.qty}x ${item.name}* (₹${(item.price * item.qty).toFixed(2)})\n`;
    if (item.addons.length > 0) {
      item.addons.forEach((addon) => {
        itemsList += `  └ _${addon.name}_ ${addon.extra_price > 0 ? `(+₹${addon.extra_price})` : ''}\n`;
      });
    }
  });

  const orderIdStr = data.orderId ? `\n🆔 *Order ID:* #${data.orderId.slice(0, 8).toUpperCase()}` : '';
  const mapsLinkStr = (data.customerLat && data.customerLng)
    ? `\n🗺️ *Location:* https://www.google.com/maps?q=${data.customerLat},${data.customerLng}`
    : '';

  return (
    `🔔 *NEW ORDER - ${data.restaurantName.toUpperCase()}* 🍔${orderIdStr}\n` +
    `---------------------------------------\n` +
    `👤 *Customer:* ${data.customerName}\n` +
    `📞 *Phone:* ${data.customerPhone}\n` +
    `📍 *Address:* ${data.customerAddress}${mapsLinkStr}\n` +
    (data.specialInstructions ? `💬 *Instructions:* ${data.specialInstructions}\n` : '') +
    `---------------------------------------\n` +
    `📦 *Items:*\n${itemsList}` +
    `---------------------------------------\n` +
    `💵 *Subtotal:* ₹${data.subtotal.toFixed(2)}\n` +
    (data.addonsTotal > 0 ? `➕ *Addons:* ₹${data.addonsTotal.toFixed(2)}\n` : '') +
    `💰 *Grand Total:* ₹${data.totalAmount.toFixed(2)}\n\n` +
    `👉 Please confirm my order. Thank you!`
  );
}

export async function sendWhatsAppNotification(
  restaurantPhone: string,
  message: string
): Promise<{ success: boolean; provider: string; messageId?: string }> {
  // In a production setup:
  // If WATI is used:
  // const response = await fetch('https://live-server.wati.io/api/v1/sendSessionMessage/...' ...)
  //
  // If Twilio is used:
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({ from: 'whatsapp:+14155238886', body: message, to: `whatsapp:${restaurantPhone}` })

  console.log('--- WHATSAPP NOTIFICATION SENT TO OWNER ---');
  console.log(`To: ${restaurantPhone}`);
  console.log(`Message:\n${message}`);
  console.log('-------------------------------------------');

  // Simulated WATI/Twilio success
  return {
    success: true,
    provider: 'Mock Notification Service (WATI/Twilio ready)',
    messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
  };
}
