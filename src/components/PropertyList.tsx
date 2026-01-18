import { Link } from 'react-router-dom';
import { MapPin, Star, Home, Car, Umbrella, Hotel } from 'lucide-react';
import React from 'react';

export interface Property {
  id: string;
  title?: string;
  city?: string;
  price_per_night?: number;
  rating?: number;
  images?: string[];
  property_type?: string;
  [key: string]: any;
}

interface PropertyListProps {
  properties: Property[];
  propertyType: string;
  loading: boolean;
  error: string | null;
  onBookNow?: (property: Property | string) => void;
  onBook?: (property: Property | string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties = [],
  propertyType,
  loading,
  error,
  onBookNow,
  onBook
}) => {
  if (loading) {
    return <div className="text-center py-12">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Erreur: {error}</div>;
  }

  if (!Array.isArray(properties) || properties.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucun bien disponible pour le moment.</div>;
  }

  const getIcon = (type?: string) => {
    if (!type) return <Home className="h-5 w-5" />;
    
    const iconMap: Record<string, React.ReactNode> = {
      'apartment': <Home className="h-5 w-5" />,
      'villa': <Home className="h-5 w-5" />,
      'hotel': <Hotel className="h-5 w-5" />,
      'car': <Car className="h-5 w-5" />,
      'tourist_activity': <Umbrella className="h-5 w-5" />
    };

    return iconMap[type] || <Home className="h-5 w-5" />;
  };

  const handleBookNow = (e: React.MouseEvent, property: Property) => {
    e.preventDefault();
    onBookNow?.(property);
    onBook?.(property);
  };

  const formatPrice = (price?: number) => {
    if (typeof price !== 'number') return 'Prix sur demande';
    
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD' 
    }).format(price);
  };

  const getPropertyTypePath = (type?: string) => {
    const pathMap: Record<string, string> = {
      'apartment': 'appartements',
      'villa': 'villas',
      'hotel': 'hotels',
      'car': 'voitures'
    };

    return pathMap[type || ''] || 'tourisme';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => {
        // Utiliser le propertyType passé en prop, sinon celui de la propriété
        const typeToUse = propertyType || property.property_type;
        const propertyTypePath = getPropertyTypePath(typeToUse);
        const imageUrl = property.images?.[0] || '';
        
        return (
          <div key={property.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <div className="relative h-48 bg-gray-100 flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={property.title || 'Image du bien'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-property.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  {getIcon(property.property_type)}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold line-clamp-2" title={property.title}>
                    {property.title || 'Sans titre'}
                  </h3>
                  {typeof property.rating === 'number' && (
                    <div className="flex items-center bg-emerald-50 px-2 py-1 rounded flex-shrink-0 ml-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">
                        {property.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {property.city && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate" title={property.city}>{property.city}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-emerald-600 font-bold">
                  {formatPrice(property.price_per_night)}
                  {property.price_per_night && '/nuit'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleBookNow(e, property)}
                    className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                  >
                    Réserver
                  </button>
                  <Link
                    to={`/${propertyTypePath}/${property.id}`}
                    className="text-sm border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir plus
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;