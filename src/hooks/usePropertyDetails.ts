import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const getTableName = (type: string) => {
  switch (type) {
    case 'hotel': return 'hotels';
    case 'apartment': return 'appartements';
    case 'villa': return 'villas';
    case 'car': return 'locations_voitures';
    case 'tourism':
    case 'circuit':
    case 'tour': return 'circuits_touristiques';
    default: return 'services';
  }
};

const getPartnerProductType = (type: string) => {
  switch (type) {
    case 'hotel': return 'hotel';
    case 'apartment': return 'appartement';
    case 'villa': return 'villa';
    case 'car': return 'voiture';
    case 'tourism':
    case 'circuit':
    case 'tour': return 'circuit';
    default: return null;
  }
};

export const usePropertyDetails = (type: string, id?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['property', type, id],
    queryFn: async () => {
      if (!id) return null;
      
      const tableName = getTableName(type);
      const partnerProductType = getPartnerProductType(type);

      // 1. Try main table
      let { data, error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (queryError) throw queryError;

      // 2. Try partner_products fallback
      if (!data && partnerProductType) {
        const { data: partnerData, error: partnerError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('id', id)
          .eq('product_type', partnerProductType)
          .maybeSingle();

        if (partnerError) console.warn('Partner fallback error:', partnerError);
        else data = partnerData;
      }

      if (!data) throw new Error(`${type} non trouvé(e)`);

      // Normalization
      return {
        ...data,
        title: data.title || data.name || '',
        description: data.description || '',
        price: data.price_per_night || data.price_per_day || data.price_per_person || data.price || 0,
        price_per_night: data.price_per_night || data.price_per_day || data.price,
        price_per_person: data.price_per_person || data.price,
        images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
        city: data.city || '',
        type,
      };
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    property: data,
    loading: isLoading,
    error: error
  };
};