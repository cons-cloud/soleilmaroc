import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  partner?: {
    company_name?: string;
  };
}

export const useHotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger depuis la table hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select(`
          id,
          name,
          description,
          price_per_night,
          city,
          region,
          address,
          stars,
          amenities,
          contact_phone,
          available,
          featured,
          images,
          created_at,
          updated_at,
          user_id,
          partner_id
        `)
        .eq('available', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (hotelsError) {
        console.error('Erreur Supabase (hotels):', hotelsError);
        throw hotelsError;
      }

      // Charger aussi depuis partner_products
      const { data: partnerHotels, error: partnerError } = await supabase
        .from('partner_products')
        .select('*, partner:profiles(company_name)')
        .eq('available', true)
        .eq('product_type', 'hotel')
        .order('created_at', { ascending: false });

      if (partnerError) {
        console.error('Erreur Supabase (partner_products):', partnerError);
        // On continue même en cas d'erreur pour les produits partenaires
      }

      // Formater les hôtels de la table principale
      const formattedHotels: Hotel[] = Array.isArray(hotelsData)
        ? (hotelsData as any[]).map((h: any) => {
            const rcRaw = h?.rooms_count;
            const rooms_count =
              typeof rcRaw === 'number'
                ? rcRaw
                : rcRaw != null && !isNaN(Number(rcRaw))
                ? Number(rcRaw)
                : undefined;
            return { ...h, rooms_count } as Hotel;
          })
        : [];

      // Formater les hôtels des partenaires
      const formattedPartnerHotels: Hotel[] = Array.isArray(partnerHotels)
        ? partnerHotels.map((product: PartnerProduct) => ({
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
            images: Array.isArray(product.images) 
              ? product.images 
              : (product.main_image ? [product.main_image] : []),
            created_at: product.created_at,
            updated_at: product.updated_at || product.created_at,
            user_id: product.partner_id || '',
            partner_id: product.partner_id,
            rooms_count: product.rooms_count || 1,
            is_partner: true,
            partner_name: product.partner?.company_name || 'Partenaire'
          }))
        : [];

      // Combiner les deux sources
      const allHotels = [...formattedHotels, ...formattedPartnerHotels];
      
      // Trier par featured puis par date
      allHotels.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setHotels(allHotels);

    } catch (err: any) {
      console.error('Erreur lors du chargement des hôtels:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des hôtels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return { 
    hotels, 
    loading, 
    error, 
    refetch: fetchHotels 
  };
};