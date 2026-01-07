import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type ServiceType = 'hotels' | 'apartments' | 'villas' | 'car_rentals' | 'circuit_touristiques';

// Interface pour les données brutes de la base de données
interface RawServiceData {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  city: string;
  region?: string | null;
  address: string;
  rating?: number | null;
  stars?: number | null;
  amenities: string[] | null;
  contact_phone: string;
  available: boolean;
  featured: boolean;
  images?: string[] | string | null;
  image?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  duration_days?: number | null;
  max_participants?: number | null;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  city: string;
  region?: string;
  address: string;
  rating?: number;
  stars?: number;
  amenities: string[];
  contact_phone: string;
  available: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  type: ServiceType;
  // Champs spécifiques aux voitures
  brand?: string;
  model?: string;
  year?: number;
  // Champs spécifiques aux circuits
  duration_days?: number;
  max_participants?: number;
}

const useServices = (
  serviceType: ServiceType, 
  options: {
    featured?: boolean;
    limit?: number;
    userId?: string;
    availableOnly?: boolean;
  } = {}
) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeServiceData = (data: RawServiceData): Service => {
    return {
      ...data,
      type: serviceType,
      region: data.region || undefined,
      rating: data.rating || undefined,
      stars: data.stars || undefined,
      amenities: data.amenities || [],
      images: Array.isArray(data.images) 
        ? data.images 
        : data.images 
          ? [data.images]
          : data.image 
            ? [data.image]
            : [],
      brand: data.brand || undefined,
      model: data.model || undefined,
      year: data.year || undefined,
      duration_days: data.duration_days || undefined,
      max_participants: data.max_participants || undefined
    };
  };

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from(serviceType)
        .select('*');

      // Filtres optionnels
      if (options.availableOnly) {
        query = query.eq('available', true);
      }
      
      if (options.featured) {
        query = query.eq('featured', true);
      }
      
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Normaliser les données
      const normalizedData = (data || []).map(normalizeServiceData);
      setServices(normalizedData);
    } catch (err) {
      console.error(`Error fetching ${serviceType}:`, err);
      setError(`Impossible de charger les ${serviceType.replace('_', ' ')}`);
    } finally {
      setLoading(false);
    }
  }, [serviceType, options.availableOnly, options.featured, options.userId, options.limit]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const refresh = () => {
    fetchServices();
  };

  return { 
    services, 
    loading, 
    error, 
    refresh 
  };
};

export default useServices;