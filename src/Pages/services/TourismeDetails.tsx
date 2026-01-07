import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle } from 'lucide-react';

const TourismeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { property, loading, error } = usePropertyDetails('tourism', id);

  const handleReserve = () => {
    if (!property) return;
    navigate(`/tourisme/${id}/reserver`, {
      state: {
        service: {
          id: property.id,
          title: property.title || property.name,
          description: property.description || '',
          price: property.price_per_person || property.price || 0,
          images: property.images || [],
          type: 'circuit'
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
          <p className="text-gray-500 mb-4">Circuit non trouvé</p>
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
                  alt={property.title || property.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Aucune image</span>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-4">{property.title || property.name}</h1>
              
              {property.city && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{property.city}</span>
                </div>
              )}

              <p className="text-2xl font-semibold text-emerald-600 mb-4">
                À partir de {property.price_per_person || property.price} MAD / personne
              </p>
              
              <p className="text-gray-700 mb-6">{property.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3 text-lg">Détails du circuit</h2>
                <div className="space-y-3">
                  {property.duration_days && (
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Durée: {property.duration_days} jour{property.duration_days > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.max_participants && (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Maximum {property.max_participants} participants</span>
                    </div>
                  )}
                  {property.highlights && Array.isArray(property.highlights) && property.highlights.length > 0 && (
                    <div>
                      <span className="font-medium">Points forts:</span>
                      <ul className="list-disc list-inside mt-1 ml-4">
                        {property.highlights.map((highlight: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {property.included && Array.isArray(property.included) && property.included.length > 0 && (
                    <div>
                      <span className="font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />
                        Inclus:
                      </span>
                      <ul className="list-disc list-inside mt-1 ml-4">
                        {property.included.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleReserve}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Réserver ce circuit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourismeDetails;