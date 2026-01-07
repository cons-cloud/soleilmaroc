// src/hooks/useCars.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  partner?: {
    company_name?: string;
  };
}

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
  marque?: string;
  modele?: string;
  annee?: number;
  type_carburant?: string;
  boite_vitesse?: string;
  nb_places?: number;
  nb_portes?: number;
  climatisation?: boolean;
}

export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatImages = (images: any, mainImage?: string): string[] => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (mainImage) return [mainImage];
    return [];
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. D'abord, récupérer uniquement les champs nécessaires
      const { data: carsData, error: carsError } = await supabase
        .from('locations_voitures')
        .select('*')
        .eq('disponible', true)
        .order('en_vedette', { ascending: false })
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;

      // 2. Charger les produits partenaires de type voiture
      const { data: partnerProducts, error: partnerError } = await supabase
        .from('partner_products')
        .select('*')
        .eq('available', true)
        .eq('product_type', 'voiture')
        .order('created_at', { ascending: false });

      if (partnerError) {
        console.error('Erreur produits partenaires:', partnerError);
      }

      // 3. Formater les voitures principales
      const formattedCars: Car[] = (carsData || []).map((car: any) => ({
        id: car.id,
        marque: car.marque || 'Marque inconnue',
        modele: car.modele || 'Modèle inconnu',
        annee: car.annee || new Date().getFullYear(),
        prix_jour: car.prix || car.prix_jour || 0, // Utilisez le bon nom de colonne ici
        ville: car.ville || 'Ville non spécifiée',
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
        product_type: 'voiture'
      }));

      // 4. Formater les voitures partenaires
      const formattedPartnerCars: Car[] = Array.isArray(partnerProducts)
        ? partnerProducts.map((product: PartnerProduct) => ({
            id: product.id,
            marque: product.marque || 'Marque inconnue',
            modele: product.modele || 'Modèle inconnu',
            annee: product.annee || new Date().getFullYear(),
            prix_jour: product.price || product.price_per_night || 0,
            ville: product.city || 'Ville non spécifiée',
            description: product.description || '',
            disponible: Boolean(product.available),
            en_vedette: Boolean(product.featured),
            images: formatImages(product.images, product.main_image),
            type_carburant: product.type_carburant,
            boite_vitesse: product.boite_vitesse,
            nb_places: product.nb_places,
            nb_portes: product.nb_portes,
            climatisation: product.climatisation,
            created_at: product.created_at,
            updated_at: product.updated_at,
            partner_id: product.partner_id,
            product_type: 'voiture',
            partner: product.partner
          }))
        : [];

      // 5. Combiner et trier
      const allCars = [...formattedCars, ...formattedPartnerCars].sort((a, b) => {
        if (a.en_vedette && !b.en_vedette) return -1;
        if (!a.en_vedette && b.en_vedette) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setCars(allCars);
    } catch (err: any) {
      console.error('Erreur lors du chargement des voitures:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des voitures');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return { cars, loading, error, refetch: fetchCars };
};