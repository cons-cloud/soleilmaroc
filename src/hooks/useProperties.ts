import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Définir le type pour une propriété
interface Property {
  id: string;
  property_type: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  created_at: string;
  // Ajoutez d'autres champs selon votre schéma
}

export const useProperties = (propertyType: string) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        console.log(`Fetching properties of type: ${propertyType}`);
        
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('property_type', propertyType)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched properties:', data);
        setProperties(data || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        
        // Gestion des erreurs de manière plus sûre
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else if (err && typeof err === 'object' && 'message' in err) {
          setError(String(err.message));
        } else {
          setError('Une erreur inconnue est survenue');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [propertyType]);

  return { properties, loading, error, setProperties };
};