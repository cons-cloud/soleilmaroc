import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { ArrowLeft, MapPin, Calendar, Car, Settings, Fuel, Users, Snowflake } from 'lucide-react';

const VoitureDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { property, loading, error } = usePropertyDetails('car', id);

  const handleReserve = () => {
    if (!property) return;
    navigate(`/voitures/${id}/reserver`, {
      state: {
        service: {
          id: property.id,
          title: `${property.brand} ${property.model} ${property.year ? property.year : ''}`,
          description: property.description || '',
          price: property.price_per_day || property.price || 0,
          images: property.images || [],
          type: 'voiture'
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erreur: {error.message}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Véhicule non trouvé</p>
          <button
            onClick={() => navigate(-1)}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0]} 
                  alt={`${property.brand} ${property.model}`}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-4">
                {property.brand} {property.model} {property.year ? property.year : ''}
              </h1>
              
              {property.city && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{property.city}</span>
                </div>
              )}

              <p className="text-2xl font-semibold text-emerald-600 mb-4">
                {property.price_per_day || property.price} MAD / jour
              </p>
              
              <p className="text-gray-700 mb-6">{property.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3 text-lg">Caractéristiques techniques</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.year && (
                    <div className="flex items-center">
                      <Car className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Année: {property.year}</span>
                    </div>
                  )}
                  {property.transmission && (
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Boîte: {property.transmission}</span>
                    </div>
                  )}
                  {property.fuel_type && (
                    <div className="flex items-center">
                      <Fuel className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Carburant: {property.fuel_type}</span>
                    </div>
                  )}
                  {property.seats && (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>{property.seats} places</span>
                    </div>
                  )}
                  {property.category && (
                    <div className="flex items-center">
                      <span>Catégorie: {property.category}</span>
                    </div>
                  )}
                  {property.has_ac !== undefined && (
                    <div className="flex items-center">
                      <Snowflake className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Climatisation: {property.has_ac ? 'Oui' : 'Non'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleReserve}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Réserver ce véhicule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoitureDetails;