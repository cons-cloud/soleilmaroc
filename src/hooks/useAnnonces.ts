import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Annonce {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  contact_phone: string;
  contact_email: string;
  city: string;
  available: boolean;
  created_at: string;
  partner?: {
    company_name: string;
  };
}

async function fetchAnnonces(): Promise<Annonce[]> {
  // 1. Charger les annonces principales
  const { data: mainAnnonces = [], error: mainError } = await supabase
    .from('annonces')
    .select('*')
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (mainError) throw mainError;

  // 2. Charger les annonces des partenaires
  const { data: partnerProducts = [] } = await supabase
    .from('partner_products')
    .select('*')
    .eq('available', true)
    .eq('product_type', 'annonce')
    .order('created_at', { ascending: false });

  // 3. Formater les annonces partenaires
  const formattedPartnerAnnonces: Annonce[] = (partnerProducts || []).map((product: any) => ({
    id: product.id,
    title: product.title || product.name || 'Annonce partenaire',
    description: product.description || '',
    category: product.category || 'autres',
    price: product.price || 0,
    images: Array.isArray(product.images) ? product.images : (product.main_image ? [product.main_image] : []),
    contact_phone: product.contact_phone || '',
    contact_email: product.contact_email || '',
    city: product.city || '',
    available: Boolean(product.available),
    created_at: product.created_at,
    partner: product.partner ? { company_name: product.partner.company_name || 'Partenaire' } : undefined
  }));

  // 4. Combiner et trier
  return [...(mainAnnonces || []), ...formattedPartnerAnnonces]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const useAnnonces = () => {
  const queryClient = useQueryClient();
  const queryKey = ['annonces'];

  const { data, isLoading, error, refetch } = useQuery<Annonce[], Error>({
    queryKey,
    queryFn: fetchAnnonces,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'annonces',
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
    annonces: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch
  };
};
