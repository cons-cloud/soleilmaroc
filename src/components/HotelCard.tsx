import { useState } from 'react';
import { Star, MapPin, Wifi, Coffee, WashingMachine, ParkingCircle, Bed, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HotelCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  rating?: number;
  images: string[];
  amenities?: string[];
  className?: string;
  onBook?: () => void;
  showActions?: boolean;
}

const HotelCard: React.FC<HotelCardProps> = ({
  id,
  title,
  description,
  price,
  location,
  rating = 0,
  images = [],
  amenities = [],
  className = '',
  onBook,
  showActions = true
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}
      whileHover={{ y: -5 }}
    >
      <div className="relative h-48 overflow-hidden group">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex] || defaultImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Pas d'image</span>
          </div>
        )}

        {/* Navigation des images */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Image précédente"
            >
              ❮
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Image suivante"
            >
              ❯
            </button>
          </>
        )}

        {/* Badge de favori */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart 
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
          />
        </button>

        {/* Indicateur de prix */}
        <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold text-teal-700">
          {price?.toLocaleString()} MAD
          <span className="text-xs font-normal">/nuit</span>
        </div>

        {/* Note */}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
          <Star className="w-3 h-3 text-yellow-500 mr-1" fill="#f59e0b" />
          {rating?.toFixed(1) || 'Nouveau'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/hotels/${id}`} className="group">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1" title={location}>{location}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={description}>
          {description}
        </p>

        {/* Équipements */}
        {amenities && amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center"
                title={amenity}
              >
                {amenity === 'Wifi' && <Wifi className="w-3 h-3 mr-1" />}
                {amenity === 'Petit déjeuner' && <Coffee className="w-3 h-3 mr-1" />}
                {amenity === 'Parking' && <ParkingCircle className="w-3 h-3 mr-1" />}
                {amenity === 'Chambres familiales' && <Users className="w-3 h-3 mr-1" />}
                {amenity === 'Service en chambre' && <Bed className="w-3 h-3 mr-1" />}
                {amenity === 'Blanchisserie' && <WashingMachine className="w-3 h-3 mr-1" />}
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                +{amenities.length - 3} plus
              </span>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" fill="#f59e0b" />
              <span className="text-sm font-medium text-gray-700">
                {rating ? rating.toFixed(1) : 'Nouveau'}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                {Math.floor(Math.random() * 50) + 5} avis
              </span>
            </div>

            <div className="flex space-x-2">
              <Link
                to={`/hotels/${id}`}
                className="px-3 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Voir plus
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBook?.();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Réserver
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HotelCard;