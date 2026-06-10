import { notFound } from 'next/navigation';
import { getSingleRestaurantMenu } from '@/lib/queries';
import RestaurantMenuClient from '@/components/RestaurantMenuClient';

export const revalidate = 60; // Revalidate static generation every 60s

export default async function HomePage() {
  const data = await getSingleRestaurantMenu();

  // Validate restaurant exists and is active
  if (!data || !data.restaurant) {
    notFound();
  }

  return (
    <RestaurantMenuClient
      restaurant={data.restaurant}
      categories={data.categories}
      menuItems={data.menuItems}
      addonGroups={data.addonGroups}
      addonGroupItems={data.addonGroupItems}
      menuItemAddons={data.menuItemAddons}
    />
  );
}
