import React, { useState } from 'react';
import ServiceHero from '../../components/ServiceHero';
import LoadingState from '../../components/LoadingState';
import BookingModal from '../../components/BookingModal';
import useServices from '../../hooks/useServices';
import RestaurantCard from '../../components/RestaurantCard';

const Restaurants: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { services, loading } = useServices('restaurants_marocsoleil');
  
  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  const filteredRestaurants = services.filter((restaurant) => {
    if (!restaurant) return false;
    
    const cityMatch = !selectedCity || 
      (restaurant.city && restaurant.city.toLowerCase() === selectedCity.toLowerCase());
    
    const searchMatch = !searchQuery || 
      (restaurant.name?.toLowerCase().includes(searchQuery) || 
      (restaurant.city && restaurant.city.toLowerCase().includes(searchQuery)) ||
      (restaurant.description && restaurant.description.toLowerCase().includes(searchQuery)) ||
      (restaurant.cuisine_type && restaurant.cuisine_type.toLowerCase().includes(searchQuery)));
    
    return cityMatch && searchMatch;
  });

  const cities = Array.from(new Set(
    services
      .filter(r => r?.city)
      .map(r => r.city as string)
  )).filter(Boolean) as string[];
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  
  const handleBookNow = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setIsBookingModalOpen(true);
  };
  
  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
    setSelectedRestaurant(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <ServiceHero 
          title="Gastronomie Marocaine"
          subtitle="Découvrez les meilleures tables du Royaume"
          images={[
            'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
          ]}
        />
        <div className="container mx-auto px-4 py-12">
          <LoadingState fullScreen={false} text="Chargement des restaurants..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceHero
        title="Restaurants"
        subtitle="Découvrez notre sélection des meilleurs restaurants pour une expérience culinaire inoubliable"
        images={[
          'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
        ]}
        searchPlaceholder="Rechercher un restaurant, une cuisine..."
        onSearch={handleSearch}
      />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4">
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

          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  title={restaurant.name}
                  description={restaurant.description || ''}
                  cuisine_type={restaurant.cuisine_type}
                  price_range={restaurant.price_range}
                  location={restaurant.city}
                  rating={restaurant.rating || 0}
                  image={restaurant.images?.[0] || restaurant.main_image || ''}
                  onBook={() => handleBookNow(restaurant)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun restaurant trouvé pour votre recherche.</p>
            </div>
          )}
        </div>
      </div>
      
      {selectedRestaurant && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBooking}
          service={{
            id: selectedRestaurant.id,
            type: 'restaurant' as any,
            title: selectedRestaurant.name,
            price: 0, // Réservation gratuite ou à régler sur place
            image: selectedRestaurant.images?.[0] || selectedRestaurant.main_image,
            description: selectedRestaurant.description || '',
            capacity: selectedRestaurant.capacity || 2,
          }}
        />
      )}
    </div>
  );
};

export default Restaurants;
