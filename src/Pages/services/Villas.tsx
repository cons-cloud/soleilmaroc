import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadServices } from '../../lib/loadServices';
import ServiceHero from '../../components/ServiceHero';
import LoadingState from '../../components/LoadingState';
import PropertyList from '../../components/PropertyList';

// Définition des types
interface Property {
  id: string;
  title?: string;
  name?: string;
  price_per_night?: number;
  price?: number;
  images?: string[];
  type?: string;
  city?: string;
  capacity?: number;
  amenities?: string[];
  [key: string]: any;
}

// type BookingHandler = (property: Property | string | React.MouseEvent) => void;

const VillasPage: React.FC = () => {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const mounted = useRef(true);

  // Gestion du montage/démontage du composant
  useEffect(() => { 
    mounted.current = true;
    return () => { 
      mounted.current = false;
    }; 
  }, []);

  // Normalisation des URLs des images
  const normalizeImages = useCallback((list: any[]): Property[] => {
    if (!Array.isArray(list)) {
      console.warn('normalizeImages: La liste fournie n\'est pas un tableau');
      return [];
    }
    
    return list.map((p: any) => {
      if (!p) {
        console.warn('normalizeImages: Élément null ou undefined dans la liste');
        return null;
      }
      
      const images: string[] = [];
      
      if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          if (typeof img === 'string' && img.trim()) {
            images.push(img.startsWith('http') ? img : 
              `${window.location.origin}${img.startsWith('/') ? '' : '/'}${img}` 
            );
          }
        });
      } else if (typeof p.image === 'string' && p.image.trim()) {
        images.push(p.image.startsWith('http') ? p.image : 
          `${window.location.origin}${p.image.startsWith('/') ? '' : '/'}${p.image}` 
        );
      }

      return {
        ...p,
        images: images.length ? images : ['/placeholder-villa.jpg'],
        // Assurez-vous que les champs nécessaires existent
        title: p.title || p.name || 'Villa sans nom',
        price_per_night: p.price_per_night || p.price || 0
      };
    }).filter(Boolean); // Retire les éléments null du tableau
  }, []);

  // Chargement des villas
  useEffect(() => {
    const loadVillas = async () => {
      if (!mounted.current) return;
      
      setLoading(true); 
      setError(null);
      
      try {
        console.log('Chargement des villas...');
        const data = await loadServices('villas', false);
        console.log('Données brutes reçues de loadServices:', data);
        
        if (!data) {
          throw new Error('Aucune donnée reçue du serveur');
        }
        
        const list = Array.isArray(data) ? data : [];
        console.log('Nombre de villas chargées:', list.length);
        
        if (list.length === 0) {
          console.warn('La liste des villas est vide');
        } else {
          console.log('Première villa chargée:', list[0]);
        }
        
        const normalized = normalizeImages(list);
        console.log('Villas normalisées:', normalized);
  
        if (mounted.current) {
          setItems(normalized);
          console.log(`Affichage de ${normalized.length} villas`);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des villas:', err);
        if (mounted.current) {
          const errorMessage = err?.response?.data?.message || 
                             err?.message || 
                             'Une erreur est survenue lors du chargement des villas';
          setError(errorMessage);
        }
      } finally { 
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    loadVillas();
    
    return () => {
      mounted.current = false;
    };
  }, [normalizeImages]);

  // Fonction pour la navigation vers la réservation
  const navigateToBooking = useCallback((property: Property) => {
    if (!property?.id) {
      console.error('Property ID is missing');
      return;
    }

    console.log('Navigation vers la réservation:', property.id);
    navigate(`/villas/${property.id}/reserver`, {
      state: {
        service: {
          id: property.id,
          title: property.title || property.name || 'Villa sans nom',
          price: property.price_per_night ?? property.price ?? 0,
          images: Array.isArray(property.images) ? property.images : [],
          type: 'villa',
          city: property.city || 'Ville non spécifiée',
          capacity: property.capacity,
          amenities: property.amenities || []
        }
      }
    });
  }, [navigate]);

  // Gestionnaire de réservation
  const handleBooking = useCallback((property: Property | string) => {
    if (typeof property === 'string') {
      const foundItem = items.find(item => item.id === property);
      if (foundItem) {
        navigateToBooking(foundItem);
      }
      return;
    }

    if (property && 'id' in property) {
      navigateToBooking(property);
    }
  }, [items, navigateToBooking]);

  // Filtrage des villas selon la recherche
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.title?.toLowerCase().includes(query) || 
       item.city?.toLowerCase().includes(query) ||
       (item.amenities || []).some((a: string) => 
         a.toLowerCase().includes(query)
       ))
    );
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
  <ServiceHero 
  title="Nos Villas de Luxe" 
  subtitle="Découvrez notre sélection exclusive de villas pour des vacances inoubliables au Maroc" 
  images={['/assets/hero/A.jpg', '/assets/hero/B.jpg']}
  searchPlaceholder="Rechercher une villa..."
  onSearch={(query) => setSearchQuery(query)}
/>
      <div className="max-w-7xl mx-auto py-12 px-4">
        {loading && <LoadingState fullScreen={false} text="Chargement des villas..." />}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <PropertyList
          properties={filteredItems}
          propertyType="villa"
          loading={loading}
          error={error}
          onBookNow={handleBooking}
          onBook={handleBooking}
        />
        {!loading && !error && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery 
                ? "Aucune villa ne correspond à votre recherche." 
                : "Aucune villa disponible pour le moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VillasPage;