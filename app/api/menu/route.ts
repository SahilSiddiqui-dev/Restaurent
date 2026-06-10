import { NextResponse } from 'next/server';
import { getSingleRestaurantMenu } from '@/lib/queries';

export async function GET() {
  try {
    const data = await getSingleRestaurantMenu();
    if (!data) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API menu error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
