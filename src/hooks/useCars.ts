// src/hooks/useCars.ts
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Car {
  id: string;
  marque: string;
  modele: string;
  annee: number;
  prix_jour: number;
  ville: string;
  disponible: boolean;
  en_vedette: boolean;
  images: string[];
  created_at: string;
  updated_at?: string;
  type_carburant?: string;
  boite_vitesse?: string;
  nb_places?: number;
  nb_portes?: number;
  climatisation?: boolean;
  description?: string;
  partner_id?: string;
  product_type?: string;
  partner?: { company_name?: string };
}

const formatImages = (images: any, mainImage?: string): string[] => {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (mainImage) return [mainImage];
  return [];
};

async function fetchMainCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('locations_voitures')
    .select('id, marque, modele, annee, prix, prix_jour, ville, disponible, en_vedette, images, type_carburant, boite_vitesse, nb_places, nb_portes, climatisation, description, created_at, updated_at')
    .eq('disponible', true)
    .order('en_vedette', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((car: any) => ({
    id: car.id,
    marque: car.marque || 'Marque inconnue',
    modele: car.modele || 'Modèle inconnu',
    annee: car.annee || new Date().getFullYear(),
    prix_jour: car.prix || car.prix_jour || 0,
    ville: car.ville || '',
    description: car.description || '',
    disponible: Boolean(car.disponible),
    en_vedette: Boolean(car.en_vedette),
    images: formatImages(car.images),
    type_carburant: car.type_carburant,
    boite_vitesse: car.boite_vitesse,
    nb_places: car.nb_places,
    nb_portes: car.nb_portes,
    climatisation: car.climatisation,
    created_at: car.created_at,
    updated_at: car.updated_at,
    product_type: 'voiture',
  }));
}

async function fetchPartnerCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('partner_products')
    .select('id, title, name, description, price, price_per_night, city, available, featured, images, main_image, created_at, updated_at, partner_id, marque, modele, annee, type_carburant, boite_vitesse, nb_places, nb_portes, climatisation')
    .eq('available', true)
    .eq('product_type', 'voiture')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('partner_products cars fetch error (non-fatal):', error.message);
    return [];
  }
  return (data || []).map((p: any) => ({
    id: p.id,
    marque: p.marque || 'Marque inconnue',
    modele: p.modele || 'Modèle inconnu',
    annee: p.annee || new Date().getFullYear(),
    prix_jour: p.price || p.price_per_night || 0,
    ville: p.city || '',
    description: p.description || '',
    disponible: Boolean(p.available),
    en_vedette: Boolean(p.featured),
    images: formatImages(p.images, p.main_image),
    type_carburant: p.type_carburant,
    boite_vitesse: p.boite_vitesse,
    nb_places: p.nb_places,
    nb_portes: p.nb_portes,
    climatisation: p.climatisation,
    created_at: p.created_at,
    updated_at: p.updated_at,
    partner_id: p.partner_id,
    product_type: 'voiture',
  }));
}

export const useCars = () => {
  const queryClient = useQueryClient();

  const [mainQuery, partnerQuery] = useQueries({
    queries: [
      {
        queryKey: ['cars', 'main'],
        queryFn: fetchMainCars,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
      },
      {
        queryKey: ['cars', 'partner'],
        queryFn: fetchPartnerCars,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      },
    ],
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'locations_voitures',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', 'main'] });
    }
  });

  useRealtimeSubscription({
    table: 'partner_products',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', 'partner'] });
    }
  });

  const cars = [...(mainQuery.data ?? []), ...(partnerQuery.data ?? [])].sort((a, b) => {
    if (a.en_vedette && !b.en_vedette) return -1;
    if (!a.en_vedette && b.en_vedette) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    cars,
    loading: mainQuery.isLoading,
    error: mainQuery.error?.message ?? partnerQuery.error?.message ?? null,
    refetch: () => { mainQuery.refetch(); partnerQuery.refetch(); },
  };
};