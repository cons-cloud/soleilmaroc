import { supabase } from './supabase';

// Interface pour les produits partenaires
interface PartnerProduct {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  price_per_night?: number;
  price_per_day?: number;
  price_per_person?: number;
  images?: string[];
  main_image?: string;
  product_type: string;
  available: boolean;
  created_at: string;
  duree?: string;
  difficulte?: string;
  ville_depart?: string;
  partner?: {
    company_name?: string;
  };
  [key: string]: any;
}

export async function loadServices(type: string, onlyAvailable = true) {
  try {
    // Mappage des types vers les noms de table et champs
    const typeConfig: Record<string, { table: string; field: string | null }> = {
      'apartment': { table: 'appartements', field: null },
      'appartement': { table: 'appartements', field: null },
      'appartements': { table: 'appartements', field: null },
      'villa': { table: 'villas', field: null },
      'villas': { table: 'villas', field: null },
      'car': { table: 'locations_voitures', field: null },
      'voiture': { table: 'locations_voitures', field: null },
      'voitures': { table: 'locations_voitures', field: null },
      'circuit': { table: 'circuits_touristiques', field: null },
      'tourism': { table: 'circuits_touristiques', field: null },
      'tour': { table: 'circuits_touristiques', field: null },
      'hotel': { table: 'hotels', field: null },
      'hotels': { table: 'hotels', field: null }
    };

    const config = typeConfig[type] || { table: 'services', field: 'type' };
    const tableName = config.table;
    const typeField = config.field;

    // Charger depuis la table principale
    let query = supabase.from(tableName).select('*');
    
    if (typeField) {
      query = query.eq(typeField, type);
    }

    // Gérer les différences de noms de colonnes selon la table
    const featuredField = tableName === 'locations_voitures' ? 'en_vedette' : 'featured';
    const availableField = tableName === 'locations_voitures' ? 'disponible' : 'available';

    // Trier et filtrer
    query = query
      .order(featuredField, { ascending: false })
      .order('created_at', { ascending: false });

    if (onlyAvailable) {
      query = query.eq(availableField, true);
    }
    
    const { data: mainData, error: mainError } = await query;
    
    if (mainError) {
      console.error('loadServices error (main):', mainError);
      throw mainError;
    }

    // Charger depuis partner_products si applicable
    const partnerTypeMap: Record<string, string> = {
      'apartment': 'appartement',
      'appartement': 'appartement',
      'villa': 'villa',
      'car': 'voiture',
      'voiture': 'voiture',
      'circuit': 'circuit',
      'tourism': 'circuit',
      'tour': 'circuit',
      'hotel': 'hotel'
    };

    const partnerType = partnerTypeMap[type];
    let partnerData: any[] = [];

    if (partnerType) {
      // Utilisation de "as any" pour éviter les problèmes de typage avec Supabase
      const { data: partnerProducts, error: partnerError } = await supabase
        .from('partner_products')
        .select('*, partner:profiles(company_name)')
        .eq('product_type', partnerType)
        .eq('available', onlyAvailable)
        .order('created_at', { ascending: false }) as any;

      if (partnerError) {
        console.error('loadServices error (partner):', partnerError);
      } else if (partnerProducts) {
        partnerData = (partnerProducts as PartnerProduct[]).map((product) => {
          const baseProduct = {
            id: `partner_${product.id}`,
            title: product.title || product.name || 'Sans titre',
            description: product.description || '',
            price_per_night: product.price || product.price_per_night,
            price_per_day: product.price || product.price_per_day,
            price_per_person: product.price || product.price_per_person,
            images: product.images || (product.main_image ? [product.main_image] : []),
            type: type,
            is_partner: true,
            partner_name: product.partner?.company_name || 'Partenaire',
            created_at: product.created_at,
            available: product.available
          };

          // Ajouter des champs spécifiques selon le type
          if (partnerType === 'circuit') {
            return {
              ...baseProduct,
              duree: product.duree || '',
              difficulte: product.difficulte || 'Moyenne',
              ville_depart: product.ville_depart || ''
            };
          }

          return baseProduct;
        });
      }
    }

    return [...(mainData || []), ...partnerData];
  } catch (error) {
    console.error('loadServices error:', error);
    throw error;
  }
}