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

        // Mapping type -> partner_products.product_type
        const partnerProductType = (() => {
          switch (type) {
            case 'hotel':
              return 'hotel';
            case 'apartment':
              return 'appartement';
            case 'villa':
              return 'villa';
            case 'car':
              return 'voiture';
            case 'tourism':
            case 'circuit':
            case 'tour':
              return 'circuit';
            default:
              return null;
          }
        })();

        // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur 406
        // quand aucun résultat n'est trouvé
        console.log(`usePropertyDetails: Recherche ${type} (id: ${id}) dans table ${tableName}`);
        
        let { data, error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (queryError) {
          console.error(`Erreur lors de la récupération ${type}:`, queryError);
          throw new Error(`Erreur lors de la récupération: ${queryError.message}`);
        }

        // Fallback: si pas trouvé dans la table principale, essayer partner_products
        if (!data && partnerProductType) {
          console.log(`usePropertyDetails: Fallback partner_products (type: ${partnerProductType}, id: ${id})`);
          const partnerRes = await supabase
            .from('partner_products')
            .select('*')
            .eq('id', id)
            .eq('product_type', partnerProductType)
            .maybeSingle();

          if (partnerRes.error) {
            console.warn(`usePropertyDetails: Erreur fallback partner_products:`, partnerRes.error);
          } else {
            data = partnerRes.data;
          }
        }
        
        // Normaliser les données pour un format cohérent
        if (data) {
          console.log(`usePropertyDetails: ${type} trouvé(e)`, data.id);
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
          // Messages d'erreur spécifiques selon le type
          let errorMessage = 'Propriété non trouvée';
          switch (type) {
            case 'hotel':
              errorMessage = 'Hôtel non trouvé(e)';
              break;
            case 'villa':
              errorMessage = 'Villa non trouvée';
              break;
            case 'apartment':
              errorMessage = 'Appartement non trouvé(e)';
              break;
            case 'car':
              errorMessage = 'Voiture non trouvée';
              break;
            case 'tourism':
            case 'circuit':
            case 'tour':
              errorMessage = 'Circuit non trouvé(e)';
              break;
            default:
              errorMessage = 'Propriété non trouvée';
          }
          console.error(`usePropertyDetails: ${errorMessage} (id: ${id}, type: ${type}, table: ${tableName})`);
          throw new Error(errorMessage);
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