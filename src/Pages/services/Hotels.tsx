import { useState } from 'react';
import ServiceHero from '../../components/ServiceHero';
import LoadingState from '../../components/LoadingState';
import BookingModal from '../../components/BookingModal';
import useServices from '../../hooks/useServices';
import type { Service } from '../../hooks/useServices';
import HotelCard from '../../components/HotelCard';

// Type personnalisé pour le service de réservation
type BookingServiceType = 'hebergement' | 'voiture' | 'circuit';

// Extension de l'interface Service pour les hôtels
interface Hotel extends Service {
  stars: number;
  city: string;
  region?: string;
  images: string[];
  capacity?: number;
}

const Hotels: React.FC = () => {
  // États locaux
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Récupération des données avec le hook useServices
  const { services, loading, error } = useServices('hotels');
  
  // Conversion des services en type Hotel
  const hotels = services as Hotel[];

  // Gestion de la sélection d'une ville
  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city);
  };
  
  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  // Filtrage des hôtels
  const filteredHotels = hotels.filter((hotel) => {
    if (!hotel) return false;
    
    const cityMatch = !selectedCity || 
      (hotel.city && hotel.city.toLowerCase() === selectedCity.toLowerCase());
    
    const searchMatch = !searchQuery || 
      (hotel.name?.toLowerCase().includes(searchQuery) || 
      (hotel.city && hotel.city.toLowerCase().includes(searchQuery)) ||
      (hotel.description && hotel.description.toLowerCase().includes(searchQuery)));
    
    return cityMatch && searchMatch;
  });

  // Extraction des villes uniques pour les filtres
  const cities = Array.from(new Set(
    hotels
      .filter(hotel => hotel?.city)
      .map(hotel => hotel.city as string)
  )).filter(Boolean) as string[];
  
  // Gestion de la réservation
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  
  const handleBookNow = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsBookingModalOpen(true);
  };
  
  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
    setSelectedHotel(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <ServiceHero 
          title="Hôtels de charme"
          subtitle="Découvrez nos hôtels soigneusement sélectionnés pour un séjour inoubliable"
          images={[
            '/assets/hero/A.jpg',
            '/assets/hero/B.jpg',
            '/assets/hero/C.jpg'
          ]}
        />
        <div className="container mx-auto px-4 py-12">
          <LoadingState 
            fullScreen={false}
            text="Chargement des hôtels..."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <ServiceHero 
          title="Hôtels de charme"
          subtitle="Découvrez nos hôtels soigneusement sélectionnés pour un séjour inoubliable"
          images={[
            '/assets/hero/A.jpg',
            '/assets/hero/B.jpg',
            '/assets/hero/C.jpg'
          ]}
        />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-500">Erreur lors du chargement des hôtels : {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceHero
        title="Nos Hôtels"
        subtitle="Découvrez notre sélection d'hôtels de charme pour un séjour inoubliable au Maroc"
        images={[
          '/assets/hero/A.jpg',
          '/assets/hero/B.jpg',
          '/assets/hero/C.jpg'
        ]}
        searchPlaceholder="Rechercher un hôtel, une ville..."
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
              {cities.map((city, index) => (
                <button
                  key={`${city}-${index}`}
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

          {/* Liste des hôtels */}
          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  id={hotel.id}
                  title={hotel.name}
                  description={hotel.description || ''}
                  price={hotel.price_per_night}
                  location={`${hotel.city}${hotel.region ? `, ${hotel.region}` : ''}`}
                  rating={hotel.rating || 0}
                  images={Array.isArray(hotel.images) ? hotel.images : []}
                  amenities={hotel.amenities || []}
                  onBook={() => handleBookNow(hotel)}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun hôtel trouvé pour votre recherche.</p>
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
      
      {selectedHotel && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBooking}
          service={{
            id: selectedHotel.id,
            type: 'hebergement' as BookingServiceType,
            title: selectedHotel.name,
            price: selectedHotel.price_per_night,
            image: Array.isArray(selectedHotel.images) && selectedHotel.images.length > 0 
              ? selectedHotel.images[0] 
              : undefined,
            description: selectedHotel.description || '',
            capacity: selectedHotel.capacity || 2,
            amenities: selectedHotel.amenities || []
          }}
        />
      )}
    </div>
  );
};

export default Hotels;