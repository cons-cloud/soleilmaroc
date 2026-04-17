import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export type ServiceType = 'hotels' | 'apartments' | 'villas' | 'car_rentals' | 'circuit_touristiques';

export interface Service {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  city: string;
  region?: string;
  address: string;
  rating?: number;
  stars?: number;
  amenities: string[];
  contact_phone: string;
  available: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  type: ServiceType;
  brand?: string;
  model?: string;
  year?: number;
  duration_days?: number;
  max_participants?: number;
}

const SELECTED_COLUMNS = `
  id, name, description, price_per_night, city, region, address,
  rating, stars, amenities, contact_phone, available, featured,
  images, image, created_at, updated_at, user_id,
  brand, model, year, duration_days, max_participants
`;

const normalizeServiceData = (data: any, serviceType: ServiceType): Service => ({
  ...data,
  type: serviceType,
  region: data.region || undefined,
  rating: data.rating || undefined,
  stars: data.stars || undefined,
  amenities: data.amenities || [],
  images: Array.isArray(data.images)
    ? data.images
    : data.images
    ? [data.images]
    : data.image
    ? [data.image]
    : [],
  brand: data.brand || undefined,
  model: data.model || undefined,
  year: data.year || undefined,
  duration_days: data.duration_days || undefined,
  max_participants: data.max_participants || undefined,
});

async function fetchServicesQuery(
  serviceType: ServiceType,
  options: { featured?: boolean; limit?: number; userId?: string; availableOnly?: boolean }
): Promise<Service[]> {
  let query = supabase.from(serviceType).select(SELECTED_COLUMNS);

  if (options.availableOnly) query = query.eq('available', true);
  if (options.featured) query = query.eq('featured', true);
  if (options.userId) query = query.eq('user_id', options.userId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d) => normalizeServiceData(d, serviceType));
}

const useServices = (
  serviceType: ServiceType,
  options: {
    featured?: boolean;
    limit?: number;
    userId?: string;
    availableOnly?: boolean;
  } = {}
) => {
  const queryKey = ['services', serviceType, options];
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<Service[], Error>({
    queryKey,
    queryFn: () => fetchServicesQuery(serviceType, options),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
    retry: 2,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: serviceType,
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['services', serviceType] });
    }
  });

  return {
    services: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refresh: refetch,
  };
};

export default useServices;