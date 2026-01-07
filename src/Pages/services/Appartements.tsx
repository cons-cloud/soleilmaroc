import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceHero from '../../components/ServiceHero';
import LoadingState from '../../components/LoadingState';
import { useApartments } from '../../hooks/useApartments';
import ApartmentCard from '../../components/ApartmentCard';

// Ajout des logs de débogage
console.log('Appartements component - Initial render');

const Appartements: React.FC = () => {
  // États locaux
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Récupération des données avec le hook useApartments
  const { apartments, loading, error, refetch } = useApartments();
  
  // Log de l'état
  console.log('Appartements state:', {
    loading,
    error,
    apartmentsCount: apartments?.length,
    apartments: apartments
  });

  // Gestion de la sélection d'une ville
  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city);
  };
  
  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  // Filtrage des appartements
  const filteredApartments = apartments.filter(apartment => {
    const matchesCity = !selectedCity || apartment.city === selectedCity;
    const matchesSearch = !searchQuery || 
      (apartment.title?.toLowerCase().includes(searchQuery) || 
       apartment.city?.toLowerCase().includes(searchQuery) ||
       apartment.description?.toLowerCase().includes(searchQuery));
    return matchesCity && matchesSearch;
  });

  // Extraction des villes uniques pour les filtres
  const cities = Array.from(new Set(apartments.map(apt => apt.city))).filter(Boolean) as string[];
  
  // Gestion de la réservation
  const navigate = useNavigate();
  
  const handleBookNow = (apartment: any) => {
    navigate(`/appartements/${apartment.id}/reserver`, {
      state: {
        service: {
          id: apartment.id,
          title: apartment.title,
          price: apartment.price_per_night,
          images: apartment.images || [],
          type: 'appartement',
          description: apartment.description
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <ServiceHero 
          title="Appartements"
          subtitle="Trouvez l'appartement idéal pour votre séjour"
          images={[
            '/assets/hero/A.jpg',
            '/assets/hero/B.jpg',
            '/assets/hero/C.jpg'
          ]}
        />
        <div className="container mx-auto px-4 py-12">
          <LoadingState 
            fullScreen={false}
            text="Chargement des appartements..."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <ServiceHero 
          title="Appartements"
          subtitle="Trouvez l'appartement idéal pour votre séjour"
          images={[
            '/assets/hero/A.jpg',
            '/assets/hero/B.jpg',
            '/assets/hero/C.jpg'
          ]}
        />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-500">Erreur lors du chargement des appartements : {error}</p>
          <button
            onClick={refetch}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceHero
        title="Nos Appartements"
        subtitle="Découvrez notre sélection d'appartements pour un séjour confortable au Maroc"
        images={[
          '/assets/hero/A.jpg',
          '/assets/hero/B.jpg',
          '/assets/hero/C.jpg'
        ]}
        searchPlaceholder="Rechercher un appartement, une ville..."
        onSearch={handleSearch}
      />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4">
          {/* Filtres par ville */}
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
              <button
                onClick={() => handleCitySelect(null)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  !selectedCity 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
              >
                Toutes les villes
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCity === city 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* Liste des appartements */}
          {filteredApartments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApartments.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  id={apartment.id}
                  title={apartment.title}
                  description={apartment.description}
                  price={apartment.price_per_night}
                  city={apartment.city}
                  region={apartment.region || ''}
                  images={apartment.images || []}
                  bedrooms={apartment.bedrooms}
                  bathrooms={apartment.bathrooms}
                  onBook={() => handleBookNow(apartment)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun appartement trouvé pour votre recherche.</p>
              {selectedCity && (
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appartements;