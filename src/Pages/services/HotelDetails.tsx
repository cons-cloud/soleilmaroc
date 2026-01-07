import { useParams } from 'react-router-dom';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';

const HotelDetails = () => {
  const { id } = useParams();
  const { property, loading, error } = usePropertyDetails('hotel', id);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!property) return <div>Hôtel non trouvé</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{property.name || property.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <img 
            src={property.images?.[0] || '/placeholder.jpg'} 
            alt={property.name || property.title}
            className="w-full rounded-lg"
          />
        </div>
        
        <div>
          <p className="text-xl font-semibold text-emerald-600">
            À partir de {property.price_per_night} MAD / nuit
          </p>
          <p className="text-gray-600">{property.city} • {property.stars} étoiles</p>
          <p className="mt-4">{property.description}</p>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-bold mb-2">Équipements</h2>
            <div className="grid grid-cols-2 gap-2">
              <p>Chambres: {property.rooms || 'Non spécifié'}</p>
              <p>WiFi: {property.has_wifi ? 'Gratuit' : 'Non disponible'}</p>
              <p>Petit déjeuner: {property.has_breakfast ? 'Inclus' : 'Non inclus'}</p>
              <p>Piscine: {property.has_pool ? 'Oui' : 'Non'}</p>
              <p>Parking: {property.has_parking ? 'Gratuit' : 'Payant'}</p>
            </div>
          </div>
          
          <button className="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700">
            Voir les disponibilités
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;