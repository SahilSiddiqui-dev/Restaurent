import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing Supabase Connection...');
  const { data: restaurant, error: rError } = await supabase
    .from('restaurant_settings')
    .select('id, name, phone')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (rError) {
    console.error('Error fetching restaurant settings:', rError);
    return;
  }
  console.log('Found Restaurant Settings:', restaurant);

  console.log('Inserting mock order...');
  const { data: order, error: oError } = await supabase
    .from('orders')
    .insert({
      customer_name: 'Test Customer',
      customer_phone: '',
      customer_address: '123 Test Street, Mumbai',
      customer_lat: 19.076,
      customer_lng: 72.877,
      items: [
        {
          id: 'f1010001-0000-0000-0000-000000000000',
          name: 'Signature Triple Cheese Burger',
          price: 289.00,
          qty: 1,
          addons: [
            { name: 'Extra Cheese Slice', extra_price: 20.00 }
          ]
        }
      ],
      addons_total: 20.00,
      subtotal: 289.00,
      total_amount: 309.00,
      special_instructions: 'Test instructions',
      status: 'pending'
    })
    .select('*')
    .single();

  if (oError) {
    console.error('Database insert order error:', oError);
  } else {
    console.log('Order inserted successfully:', order);
  }
}

testInsert();
