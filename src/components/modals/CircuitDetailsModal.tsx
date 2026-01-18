import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CircuitDetailsModalProps {
  circuit: {
    id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    rating?: number;
    duration?: string;
    city?: string;
    tags?: string[];
    highlights?: string[];
    included?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

const CircuitDetailsModal: React.FC<CircuitDetailsModalProps> = ({
  circuit,
  isOpen,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const images = Array.isArray(circuit.images) ? circuit.images : [];
  const hasImages = images.length > 0;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleReserve = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    // Naviguer vers la page de réservation avec les informations du circuit
    navigate(`/tourisme/${circuit.id}/reserver`, {
      state: {
        service: {
          id: circuit.id,
          title: circuit.title,
          description: circuit.description,
          price: circuit.price || 0,
          images: Array.isArray(circuit.images) ? circuit.images : [],
          type: 'circuit'
        }
      }
    });
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    navigate(`/tourisme/${circuit.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{circuit.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Images Section */}
            <div className="space-y-4">
              {hasImages ? (
                <>
                  {/* Main Image */}
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden group">
                    <img
                      src={images[currentImageIndex]}
                      alt={circuit.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/hero/hero1.jpg';
                      }}
                    />
                    
                    {/* Navigation buttons */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={goToPrevious}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Image précédente"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={goToNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Image suivante"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                        
                        {/* Image counter */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(0, 4).map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition ${
                            index === currentImageIndex
                              ? 'border-emerald-600 ring-2 ring-emerald-300'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/hero/hero1.jpg';
                            }}
                          />
                        </button>
                      ))}
                      {images.length > 4 && (
                        <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Aucune image disponible</span>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              {/* Rating and price */}
              <div className="flex items-center justify-between">
                {circuit.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{circuit.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="text-2xl font-bold text-emerald-600">
                  {circuit.price?.toLocaleString()} MAD
                  {circuit.price && <span className="text-sm text-gray-500 font-normal">/personne</span>}
                </div>
              </div>

              {/* Location */}
              {circuit.city && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{circuit.city}</span>
                </div>
              )}

              {/* Duration */}
              {circuit.duration && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{circuit.duration}</span>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{circuit.description}</p>
              </div>

              {/* Tags */}
              {circuit.tags && Array.isArray(circuit.tags) && circuit.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Destinations</h3>
                  <div className="flex flex-wrap gap-2">
                    {circuit.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {circuit.highlights && Array.isArray(circuit.highlights) && circuit.highlights.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Points forts</h3>
                  <ul className="space-y-1">
                    {circuit.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-emerald-600 mr-2">✓</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Included */}
              {circuit.included && Array.isArray(circuit.included) && circuit.included.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Inclus</h3>
                  <ul className="space-y-1">
                    {circuit.included.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-emerald-600 mr-2">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
          >
            Voir tous les détails
          </button>
          <button
            onClick={handleReserve}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Calendar className="h-5 w-5" />
            Réserver maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default CircuitDetailsModal;

