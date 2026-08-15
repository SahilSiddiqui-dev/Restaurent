# Restaurent (CityBite)

A dark-themed restaurant ordering platform built with **Next.js 14** and **Supabase**.

It includes:
- Customer-facing menu and checkout flow
- Addon/customization support per menu item
- Order placement API with validation and sanitization
- Admin dashboard for realtime order management
- Admin pages for menu, addon, and restaurant settings

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Realtime)
- Zustand (cart state)
- Framer Motion + Lucide icons

## Project Structure

- `/home/runner/work/Restaurent/Restaurent/app` - App Router pages and API routes
  - `app/page.tsx` - public restaurant menu
  - `app/checkout/page.tsx` - checkout, address/map handling, order submission
  - `app/admin/*` - admin login, dashboard, menu/addon/settings pages
  - `app/api/menu/route.ts` - fetches active restaurant menu data
  - `app/api/order/route.ts` - validates and stores orders, builds WhatsApp redirect URL
- `/home/runner/work/Restaurent/Restaurent/components` - UI components (menu, cart drawer, addon modal)
- `/home/runner/work/Restaurent/Restaurent/lib` - Supabase client, queries, notifications, cart store
- `/home/runner/work/Restaurent/Restaurent/schema.sql` - database schema + RLS policies
- `/home/runner/work/Restaurent/Restaurent/seed.sql` - sample restaurant/menu data

## Prerequisites

- Node.js 18+
- npm
- A Supabase project

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill values:

```bash
cp .env.local.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional for map autocomplete; checkout falls back to demo mode if missing)

## Database Setup (Supabase)

1. Open your Supabase SQL editor.
2. Run `/home/runner/work/Restaurent/Restaurent/schema.sql`.
3. Run `/home/runner/work/Restaurent/Restaurent/seed.sql`.
4. Create an auth user for admin login.
5. Set `restaurant_settings.owner_id` to that user’s `auth.users.id`.

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev     # start development server
npm run build   # production build
npm run start   # run production build
npm run lint    # run Next.js lint
```

## Main Flows

### Customer
- Browse categories/items on `/`
- Add addons and manage cart
- Checkout at `/checkout`
- Place order (POST `/api/order`)
- Redirect to WhatsApp URL for confirmation message

### Admin
- Login at `/admin/login`
- Manage incoming realtime orders at `/admin/dashboard`
- Update menu/addons/settings from admin pages

## Notes

- `sendWhatsAppNotification` in `lib/notifications.ts` is currently mocked (console output) and prepared for real provider integration (e.g., Twilio/WATI).
- The app is currently configured for a single active restaurant (`getSingleRestaurantMenu`).

