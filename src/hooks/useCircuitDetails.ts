import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Circuit {
  id: string;
  title: string;
  description: string;
  images: string[];
  price_per_person: number;
  duration_days: number;
  city: string;
  highlights: string[];
  included: string[];
  not_included: string[];
  itinerary: any[];
  max_participants: number;
  available: boolean;
}

export const useCircuitDetails = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = ['circuit', id];

  const { data, isLoading, error } = useQuery<Circuit | null, Error>({
    queryKey,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('circuits_touristiques')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'circuits_touristiques',
    callback: (payload) => {
      if (payload.new && (payload.new as any).id === id) {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  });

  return {
    circuit: data,
    loading: isLoading,
    error: error?.message ?? null,
  };
};
