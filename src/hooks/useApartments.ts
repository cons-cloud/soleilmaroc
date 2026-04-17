import { useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Apartment {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  city: string;
  region: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities: string[];
  contact_phone?: string;
  available: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
  updated_at?: string;
  product_type?: string;
  partner?: { company_name?: string };
}

const formatAmenities = (amenities: any): string[] => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities.filter(Boolean);
  if (typeof amenities === 'object') return Object.values(amenities).filter(Boolean) as string[];
  return [];
};

const formatImages = (images: any, mainImage?: string): string[] => {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (mainImage) return [mainImage];
  return [];
};

async function fetchMainApartments(): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('appartements')
    .select('id, title, description, price_per_night, city, region, address, bedrooms, bathrooms, amenities, contact_phone, available, featured, images, created_at, updated_at')
    .eq('available', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((apt: any) => ({
    id: apt.id,
    title: apt.title || '',
    description: apt.description || '',
    price_per_night: apt.price_per_night || 0,
    city: apt.city || '',
    region: apt.region || '',
    address: apt.address || '',
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    amenities: formatAmenities(apt.amenities),
    contact_phone: apt.contact_phone,
    available: Boolean(apt.available),
    featured: Boolean(apt.featured),
    images: formatImages(apt.images),
    created_at: apt.created_at,
    updated_at: apt.updated_at,
    product_type: 'appartement',
  }));
}

async function fetchPartnerApartments(): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('partner_products')
    .select('id, title, name, description, price, price_per_night, city, region, address, bedrooms, bathrooms, amenities, contact_phone, available, featured, images, main_image, created_at, updated_at, partner_id')
    .eq('available', true)
    .eq('product_type', 'appartement')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('partner_products fetch error (non-fatal):', error.message);
    return [];
  }
  return (data || []).map((p: any) => ({
    id: p.id,
    title: p.title || p.name || 'Appartement partenaire',
    description: p.description || '',
    price_per_night: p.price || p.price_per_night || 0,
    city: p.city || '',
    region: p.region || '',
    address: p.address || '',
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    amenities: formatAmenities(p.amenities),
    contact_phone: p.contact_phone,
    available: Boolean(p.available),
    featured: Boolean(p.featured),
    images: formatImages(p.images, p.main_image),
    created_at: p.created_at,
    updated_at: p.updated_at,
    product_type: 'appartement',
  }));
}

export const useApartments = () => {
  const queryClient = useQueryClient();

  // Deux requêtes en PARALLÈLE (plus rapide) avec cache partagé
  const [mainQuery, partnerQuery] = useQueries({
    queries: [
      {
        queryKey: ['apartments', 'main'],
        queryFn: fetchMainApartments,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
      },
      {
        queryKey: ['apartments', 'partner'],
        queryFn: fetchPartnerApartments,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      },
    ],
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'appartements',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', 'main'] });
    }
  });

  useRealtimeSubscription({
    table: 'partner_products',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', 'partner'] });
    }
  });

  const apartments = [
    ...(mainQuery.data ?? []),
    ...(partnerQuery.data ?? []),
  ].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    apartments,
    loading: mainQuery.isLoading,
    error: mainQuery.error?.message ?? partnerQuery.error?.message ?? null,
    refetch: () => { mainQuery.refetch(); partnerQuery.refetch(); },
  };
};