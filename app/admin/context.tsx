'use client';

import React, { createContext, useContext } from 'react';
import { Restaurant } from '@/lib/queries';

export interface AdminContextType {
  user: any;
  restaurant: Restaurant | null;
  loading: boolean;
  refreshRestaurant: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType>({
  user: null,
  restaurant: null,
  loading: true,
  refreshRestaurant: async () => {},
});

export const useAdmin = () => useContext(AdminContext);
