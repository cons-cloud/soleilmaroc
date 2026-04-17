import { useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { Hotel } from '../types/hotel';

interface PartnerProduct {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  price_per_night?: number;
  city?: string;
  region?: string;
  address?: string;
  stars?: number;
  amenities?: any[];
  contact_phone?: string;
  available: boolean;
  featured?: boolean;
  main_image?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  partner_id?: string;
  rooms_count?: number;
  partner?: { company_name?: string };
}

async function fetchMainHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, description, price_per_night, city, region, address, stars, amenities, contact_phone, available, featured, images, created_at, updated_at, user_id, partner_id, rooms_count')
    .eq('available', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((h: any) => ({
    ...h,
    rooms_count: typeof h.rooms_count === 'number' ? h.rooms_count : (h.rooms_count != null && !isNaN(Number(h.rooms_count)) ? Number(h.rooms_count) : undefined),
  })) as Hotel[];
}

async function fetchPartnerHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('partner_products')
    .select('id, title, name, description, price, price_per_night, city, region, address, stars, amenities, contact_phone, available, featured, images, main_image, created_at, updated_at, partner_id, rooms_count')
    .eq('available', true)
    .eq('product_type', 'hotel')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('partner_products hotels fetch error (non-fatal):', error.message);
    return [];
  }
  return (data || []).map((product: PartnerProduct) => ({
    id: product.id,
    name: product.title || product.name || 'Hôtel partenaire',
    description: product.description || '',
    price_per_night: product.price || product.price_per_night || 0,
    city: product.city || '',
    region: product.region || '',
    address: product.address || '',
    stars: product.stars || 3,
    amenities: Array.isArray(product.amenities) ? product.amenities : [],
    contact_phone: product.contact_phone || '',
    available: Boolean(product.available),
    featured: Boolean(product.featured),
    images: Array.isArray(product.images) ? product.images : (product.main_image ? [product.main_image] : []),
    created_at: product.created_at,
    updated_at: product.updated_at || product.created_at,
    user_id: product.partner_id || '',
    partner_id: product.partner_id,
    rooms_count: product.rooms_count || 1,
    is_partner: true,
  })) as Hotel[];
}

export const useHotels = () => {
  const queryClient = useQueryClient();

  const [mainQuery, partnerQuery] = useQueries({
    queries: [
      {
        queryKey: ['hotels', 'main'],
        queryFn: fetchMainHotels,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
      },
      {
        queryKey: ['hotels', 'partner'],
        queryFn: fetchPartnerHotels,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      },
    ],
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'hotels',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', 'main'] });
    }
  });

  useRealtimeSubscription({
    table: 'partner_products',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', 'partner'] });
    }
  });

  const hotels = [...(mainQuery.data ?? []), ...(partnerQuery.data ?? [])].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    hotels,
    loading: mainQuery.isLoading,
    error: mainQuery.error?.message ?? partnerQuery.error?.message ?? null,
    refetch: () => { mainQuery.refetch(); partnerQuery.refetch(); },
  };
};