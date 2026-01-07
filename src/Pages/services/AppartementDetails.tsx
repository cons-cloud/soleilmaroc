import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { ArrowLeft, MapPin, Bed, Bath, Square, Calendar } from 'lucide-react';

const AppartementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { property, loading, error } = usePropertyDetails('apartment', id);

  const handleReserve = () => {
    if (!property) return;
    navigate(`/appartements/${id}/reserver`, {
      state: {
        service: {
          id: property.id,
          title: property.title || property.name,
          description: property.description || '',
          price: property.price_per_night || property.price || 0,
          images: property.images || [],
          type: 'appartement'
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
          <p className="text-gray-500 mb-4">Appartement non trouvé</p>
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
          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0]} 
                  alt={property.title || property.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Aucune image</span>
                </div>
              )}
            </div>
            
            {/* Détails */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{property.title || property.name}</h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{property.city} {property.region ? `• ${property.region}` : ''}</span>
              </div>

              <p className="text-2xl font-semibold text-emerald-600 mb-4">
                {property.price_per_night || property.price} MAD / nuit
              </p>
              
              <p className="text-gray-700 mb-6">{property.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3 text-lg">Caractéristiques</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>{property.bedrooms} chambre{property.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>{property.bathrooms} salle{property.bathrooms > 1 ? 's' : ''} de bain</span>
                    </div>
                  )}
                  {property.surface_area && (
                    <div className="flex items-center">
                      <Square className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>{property.surface_area} m²</span>
                    </div>
                  )}
                  {property.type && (
                    <div className="flex items-center">
                      <span className="text-gray-600">Type: {property.type}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleReserve}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Réserver maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppartementDetails;