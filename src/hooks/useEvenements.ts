import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time?: string;
  image: string;
  category: string;
  price: number;
  available_seats: number;
  available: boolean;
  created_at: string;
  end_date?: string;
  date?: string; // alias
  time?: string; // alias
}

async function fetchEvents(): Promise<Event[]> {
  let mainEvents: any[] = [];
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('*');
    
    if (!error) {
      // Filtrer et trier en mémoire pour éviter les erreurs SQL 400 si les colonnes manquent
      mainEvents = (data || [])
        .filter(e => e.available !== false) // Par défaut true si manquant
        .sort((a, b) => {
          const dateA = a.event_date || a.date || '';
          const dateB = b.event_date || b.date || '';
          return dateA.localeCompare(dateB);
        });
    } else {
      console.warn("Supabase evenements query error:", error);
    }
  } catch (err) {
    console.warn("Could not fetch main evenements", err);
  }

  // 2. Charger les événements des partenaires
  const { data: partnerEvents = [] } = await supabase
    .from('partner_products')
    .select('*')
    .eq('available', true)
    .eq('product_type', 'evenement')
    .order('created_at', { ascending: false });

  // 3. Formater les événements partenaires
  const formattedPartnerEvents: Event[] = (partnerEvents || []).map((product: any) => ({
    id: product.id,
    title: product.title || product.name || 'Événement partenaire',
    event_date: product.event_date || product.date || '',
    date: product.event_date || product.date || '',
    location: product.location || product.city || '',
    event_time: product.event_time || product.time || '',
    time: product.event_time || product.time || '',
    description: product.description || '',
    image: Array.isArray(product.images) && product.images.length > 0 
      ? product.images[0] 
      : (product.main_image || '/assets/events/T0.jpeg'),
    category: product.category || 'Culture',
    price: product.price || 0,
    available_seats: product.available_seats || 0,
    available: Boolean(product.available),
    created_at: product.created_at
  }));

  // 4. Combiner et trier
  return [...(mainEvents || []), ...formattedPartnerEvents].sort((a, b) => {
    const dateA = a.event_date || a.date || '';
    const dateB = b.event_date || b.date || '';
    return dateA.localeCompare(dateB);
  });
}

export const useEvenements = () => {
  const queryClient = useQueryClient();
  const queryKey = ['evenements'];

  const { data, isLoading, error, refetch } = useQuery<Event[], Error>({
    queryKey,
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'evenements',
    callback: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  useRealtimeSubscription({
    table: 'partner_products',
    callback: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    events: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch
  };
};

export default useEvenements;
