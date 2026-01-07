// src/hooks/useCreateProperty.ts
import { useState } from 'react';
import { supabase } from '../lib/supabase';  // Importez les deux depuis le même fichier

// Définir le type localement si l'import échoue
type Property = {
  id: string;
  title: string;
  description: string;
  property_type: 'apartment' | 'villa' | 'hotel' | 'car' | 'tour';
  address: string;
  city: string;
  price_per_night: number;
  images: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export const useCreateProperty = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('properties')
        .insert([{
          ...propertyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      return data;
    } catch (err: any) {
      console.error('Erreur lors de la création:', err);
      setError(err.message || 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProperty, loading, error };
};