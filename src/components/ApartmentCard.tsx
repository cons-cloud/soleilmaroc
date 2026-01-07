import { useState } from 'react';
import { FiHome, FiChevronLeft, FiChevronRight } from 'react-icons/fi'; 
import { useNavigate } from 'react-router-dom';

interface ApartmentCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  region?: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  onBook: () => void;
}

const ApartmentCard: React.FC<ApartmentCardProps> = ({
  id,
  title,
  description,
  price,
  city,
  region = '',
  images = [],
  bedrooms,
  bathrooms,
  onBook
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

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

  const handleViewDetails = () => {
    navigate(`/appartements/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image du haut */}
      <div className="relative h-48 bg-gray-200 cursor-pointer" onClick={handleViewDetails}>
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback si l'image ne se charge pas
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-apartment.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <FiHome className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Image précédente"
            >
              <FiChevronLeft />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Image suivante"
            >
              <FiChevronRight />
            </button>
          </>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-emerald-600" 
            onClick={handleViewDetails}
          >
            {title}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mt-1">
          {city} {region && `• ${region}`}
        </p>
        
        {(bedrooms || bathrooms) && (
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            {bedrooms !== undefined && (
              <span>{bedrooms} chambre{bedrooms > 1 ? 's' : ''}</span>
            )}
            {bathrooms !== undefined && (
              <span>{bathrooms} salle{bathrooms > 1 ? 's' : ''} de bain</span>
            )}
          </div>
        )}
        
        <p className="mt-2 text-gray-700 line-clamp-2 text-sm">
          {description}
        </p>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-lg font-bold text-emerald-600">
            {price.toLocaleString()} MAD / nuit
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emergent-700 transition-colors font-medium"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApartmentCard;