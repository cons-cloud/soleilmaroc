// src/components/CarCard.tsx
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

interface CarCardProps {
  id: string;
  marque: string;
  modele: string;
  annee: number;
  prix_jour: number;
  ville: string;
  description?: string;
  images: string[];
  type_carburant?: string;
  boite_vitesse?: string;
  nb_places?: number;
  nb_portes?: number;
  climatisation?: boolean;
  en_vedette?: boolean;
  partner?: {
    company_name?: string;
  };
  onBook: () => void;
  onViewDetails: () => void;
}

const CarCard: React.FC<CarCardProps> = ({
  marque,
  modele,
  annee,
  prix_jour,
  ville,
  description,
  images = [],
  type_carburant,
  boite_vitesse,
  nb_places,
 
  climatisation,
  en_vedette,
  partner,
  onBook,
  onViewDetails
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onViewDetails}
    >
      {/* En-tête avec image */}
      <div className="relative h-48 bg-gray-200">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={`${marque} ${modele}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-car.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-400">Aucune image disponible</div>
          </div>
        )}
        
        {en_vedette && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <FiStar className="mr-1" /> En vedette
          </div>
        )}
        
        {partner?.company_name && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs">
            {partner.company_name}
          </div>
        )}
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
              aria-label="Image précédente"
            >
              <FiChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
              aria-label="Image suivante"
            >
              <FiChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Corps de la carte */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {marque} {modele} <span className="text-gray-500">({annee})</span>
            </h3>
            <p className="text-emerald-600 font-medium">
              {prix_jour.toLocaleString()} MAD <span className="text-gray-500 text-sm">/ jour</span>
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
            {ville}
          </span>
        </div>

        {description && (
          <p className="mt-2 text-gray-600 text-sm line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {type_carburant && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {type_carburant}
            </span>
          )}
          {boite_vitesse && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {boite_vitesse}
            </span>
          )}
          {nb_places && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {nb_places} places
            </span>
          )}
          {climatisation && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              Climatisation
            </span>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            Réserver maintenant
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;