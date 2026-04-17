import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface Property {
  id: string;
  property_type: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  created_at: string;
}

export const useProperties = (propertyType: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<Property[], Error>({
    queryKey: ['properties', propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, property_type, title, description, price, location, bedrooms, bathrooms, area, created_at')
        .eq('property_type', propertyType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'properties',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', propertyType] });
    }
  });

  return {
    properties: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
};