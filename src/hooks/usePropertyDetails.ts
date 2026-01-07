import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePropertyDetails = (type: string, id?: string) => {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Déterminer la table en fonction du type
        let tableName = '';
        switch (type) {
          case 'hotel':
            tableName = 'hotels';
            break;
          case 'apartment':
            tableName = 'appartements';
            break;
          case 'villa':
            tableName = 'villas';
            break;
          case 'car':
            tableName = 'locations_voitures';
            break;
          case 'tourism':
          case 'circuit':
          case 'tour':
            tableName = 'circuits_touristiques';
            break;
          default:
            tableName = 'services';
        }

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Normaliser les données pour un format cohérent
        if (data) {
          const normalized = {
            ...data,
            title: data.title || data.name || '',
            description: data.description || '',
            price: data.price_per_night || data.price_per_day || data.price_per_person || 0,
            images: data.images || [],
            city: data.city || '',
            type: type
          };
          setProperty(normalized);
        } else {
          throw new Error('Propriété non trouvée');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, type]);

  return { property, loading, error };
};