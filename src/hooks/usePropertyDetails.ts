import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const usePropertyDetails = (type: string, id?: string) => {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
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

        // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur 406
        // quand aucun résultat n'est trouvé
        const { data, error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (queryError) {
          console.error('Erreur lors de la récupération:', queryError);
          throw new Error(`Erreur lors de la récupération: ${queryError.message}`);
        }
        
        // Normaliser les données pour un format cohérent
        if (data) {
          const normalized = {
            ...data,
            title: data.title || data.name || '',
            description: data.description || '',
            price: data.price_per_night || data.price_per_day || data.price_per_person || data.price || 0,
            price_per_night: data.price_per_night || data.price_per_day || data.price,
            price_per_person: data.price_per_person || data.price,
            images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
            city: data.city || '',
            type: type
          };
          setProperty(normalized);
        } else {
          throw new Error(`${type === 'hotel' ? 'Hôtel' : type === 'villa' ? 'Villa' : type === 'tourism' || type === 'circuit' ? 'Circuit' : 'Propriété'} non trouvé(e)`);
        }
      } catch (err: any) {
        console.error('Erreur usePropertyDetails:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, type]);

  return { property, loading, error };
};