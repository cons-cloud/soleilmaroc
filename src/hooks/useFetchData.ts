import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useFetchData = <T,>(
  table: string, 
  query: string = '*', 
  filter: { column: string; value: any } | null = null
) => {
  const queryKey = ['fetchData', table, query, filter];
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<T[], Error>({
    queryKey,
    queryFn: async () => {
      let queryBuilder = supabase
        .from(table)
        .select(query)
        .eq('available', true);
      
      if (filter) {
        queryBuilder = queryBuilder.eq(filter.column, filter.value);
      }
      
      const { data: fetchedData, error: fetchError } = await queryBuilder;

      if (fetchError) throw fetchError;
      return (fetchedData || []) as T[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table,
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['fetchData', table] });
    }
  });

  return { 
    data: data ?? [], 
    isLoading, 
    error: error?.message ?? null, 
    refetch 
  };
};

export default useFetchData;
