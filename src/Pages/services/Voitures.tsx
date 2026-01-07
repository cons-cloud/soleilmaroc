import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceHero from '../../components/ServiceHero';
import LoadingState from '../../components/LoadingState';
import CarCard from '../../components/carCard';
import { useCars } from '../../hooks/useCars';

const VoituresPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const { cars, loading, error, refetch } = useCars();
  const navigate = useNavigate();

  const handleBookNow = useCallback((car: any) => {
    if (!car?.id) {
      console.error('handleBookNow: invalid car', car);
      return;
    }
    navigate(`/voitures/${car.id}/reserver`, {
      state: {
        service: {
          id: car.id,
          title: `${car.marque} ${car.modele}`,
          price: car.prix_jour,
          images: Array.isArray(car.images) ? car.images : [],
          type: 'voiture',
          city: car.ville,
          marque: car.marque,
          modele: car.modele,
          annee: car.annee,
          type_carburant: car.type_carburant,
          boite_vitesse: car.boite_vitesse
        }
      }
    });
  }, [navigate]);

  const handleViewDetails = useCallback((carId: string) => {
    navigate(`/voitures/${carId}`);
  }, [navigate]);

  // Filtrer les voitures par recherche et ville
  const filteredCars = cars.filter(car => {
    const matchesSearch = `${car.marque} ${car.modele} ${car.ville} ${car.description || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesCity = !selectedCity || car.ville.toLowerCase() === selectedCity.toLowerCase();
    
    return matchesSearch && matchesCity;
  });

  // Extraire les villes uniques pour le filtre
  const cities = Array.from(new Set(cars.map(car => car.ville).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceHero 
        title="Locations de voitures" 
        subtitle="Trouvez la voiture idéale" 
        images={['/assets/hero/A.jpg', '/assets/hero/B.jpg']} 
        searchPlaceholder="Rechercher une voiture..."
        onSearch={setSearchQuery}
      />
      
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Filtres */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
            >
              <option value="">Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Marque, modèle, ville..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState fullScreen={false} text="Chargement des voitures..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Erreur lors du chargement des voitures : {error}</p>
            <button
              onClick={refetch}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredCars.length} {filteredCars.length > 1 ? 'voitures disponibles' : 'voiture disponible'}
              </h2>
            </div>

            {filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCars.map(car => (
                  <CarCard
                    key={car.id}
                    {...car}
                    onBook={() => handleBookNow(car)}
                    onViewDetails={() => handleViewDetails(car.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Aucune voiture trouvée
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Essayez de modifier vos critères de recherche
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCity('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VoituresPage;