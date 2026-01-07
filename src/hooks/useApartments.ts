import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Interface pour les données brutes d'un appartement partenaire
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
  bedrooms?: number;
  bathrooms?: number;
  
  
  amenities?: any;
  contact_phone?: string;
  available?: boolean;
  featured?: boolean;
  images?: string[];
  main_image?: string;
  created_at: string;
  updated_at?: string;
  partner_id?: string;
  partner?: {
    company_name?: string;
  };
}

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
  surface_area?: number;
  
  amenities: string[];
  contact_phone?: string;
  available: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
  updated_at?: string;
  
  product_type?: string;
  partner?: {
    company_name?: string;
  };
}

export const useApartments = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatAmenities = (amenities: any): string[] => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities.filter(Boolean);
    if (typeof amenities === 'object') {
      return Object.values(amenities).filter(Boolean) as string[];
    }
    return [];
  };

  const formatImages = (images: any, mainImage?: string): string[] => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (mainImage) return [mainImage];
    return [];
  };

  const fetchApartments = async () => {
    try {
      console.log('Fetching apartments...');
      setLoading(true);
      setError(null);
      
      // 1. Load from appartements table
      const { data: apartmentsData, error: apartmentsError } = await supabase
  .from('appartements')
  .select(`
    id,
    title,
    description,
    price_per_night,
    city,
    region,
    address,
    bedrooms,
    bathrooms,
    amenities,
    contact_phone,
    available,
    featured,
    images,
    created_at,
    updated_at
  `)
  .eq('available', true)
  .order('featured', { ascending: false })
  .order('created_at', { ascending: false });

      if (apartmentsError) throw apartmentsError;

      // 2. Load from partner_products
      const { data: partnerProducts, error: partnerError } = await supabase
        .from('partner_products')
        .select('*')
        .eq('available', true)
        .eq('product_type', 'appartement')
        .order('created_at', { ascending: false });

      if (partnerError) {
        console.error('Supabase error (partner_products):', partnerError);
        // Continue even if there's an error with partner products
      }

      // 3. Format main apartments
      const formattedApartments: Apartment[] = (apartmentsData || []).map((apartment: any) => ({
        id: apartment.id,
        title: apartment.title || '',
        description: apartment.description || '',
        price_per_night: apartment.price_per_night || 0,
        city: apartment.city || '',
        region: apartment.region || '',
        address: apartment.address || '',
        bedrooms: apartment.bedrooms,
        bathrooms: apartment.bathrooms,
        
        type: apartment.type || 'appartement',
        amenities: formatAmenities(apartment.amenities),
        contact_phone: apartment.contact_phone,
        available: Boolean(apartment.available),
        featured: Boolean(apartment.featured),
        images: formatImages(apartment.images),
        created_at: apartment.created_at,
        updated_at: apartment.updated_at,
       
        product_type: 'appartement'
      }));

      // 4. Format partner apartments
      const formattedPartnerApartments: Apartment[] = (partnerProducts || []).map((product: PartnerProduct) => ({
        id: product.id,
        title: product.title || product.name || 'Appartement partenaire',
        description: product.description || '',
        price_per_night: product.price || product.price_per_night || 0,
        city: product.city || 'Ville non spécifiée',
        region: product.region || '',
        address: product.address || '',
        bedrooms: product.bedrooms,
        bathrooms: product.bathrooms,
        
        
        amenities: formatAmenities(product.amenities),
        contact_phone: product.contact_phone,
        available: Boolean(product.available),
        featured: Boolean(product.featured),
        images: formatImages(product.images, product.main_image),
        created_at: product.created_at,
        updated_at: product.updated_at,
        
        product_type: 'appartement',
        partner: product.partner
      }));

      // 5. Combine and sort
      const allApartments = [...formattedApartments, ...formattedPartnerApartments]
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      console.log('All apartments loaded:', allApartments);
      setApartments(allApartments);

    } catch (err: any) {
      console.error('Error in fetchApartments:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des appartements');
      setApartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  return { 
    apartments, 
    loading, 
    error, 
    refetch: fetchApartments 
  };
};