import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star as StarIcon, 
  MapPin, 
  Heart, 
  Home, 
  Building, 
  Car, 
  Map, 
  Bed, 
  Users, 
  Wifi, 
  Coffee, 
  ParkingCircle as ParkingIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import type { Service, ServiceType } from '../hooks/useServices';

interface ServiceCardProps extends Partial<Omit<Service, 'name'>> {
  id: string;
  title: string;
  description: string;
  images?: string[];
  className?: string;
  onBook?: () => void;
  onImageClick?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
  price?: number;
  price_per_night?: number;
  link?: string;
  tags?: string[];
  rating?: number;
  duration?: string;
  city?: string;
  region?: string;
  amenities?: string[];
  type?: ServiceType;
  featured?: boolean;
}

export type { ServiceCardProps };

const getServiceIcon = (type: ServiceType) => {
  const iconClass = "w-4 h-4 mr-1";
  switch (type) {
    case 'hotels': return <Home className={iconClass} />;
    case 'apartments': return <Building className={iconClass} />;
    case 'villas': return <Home className={iconClass} />;
    case 'car_rentals': return <Car className={iconClass} />;
    case 'circuit_touristiques': return <Map className={iconClass} />;
    default: return null;
  }
};

const getAmenityIcon = (amenity: string) => {
  const iconClass = "w-4 h-4 mr-1";
  const lowerAmenity = amenity.toLowerCase();
  
  if (lowerAmenity.includes('wifi')) return <Wifi className={iconClass} />;
  if (lowerAmenity.includes('café') || lowerAmenity.includes('cafe')) return <Coffee className={iconClass} />;
  if (lowerAmenity.includes('parking')) return <ParkingIcon className={iconClass} />;
  if (lowerAmenity.includes('lit') || lowerAmenity.includes('chambre')) return <Bed className={iconClass} />;
  if (lowerAmenity.includes('personnes') || lowerAmenity.includes('personne')) return <Users className={iconClass} />;
  return null;
};

const ImageSlider = ({ 
  images = [], 
  title,
  onNext,
  onPrev 
}: { 
  images: string[];
  title: string;
  onNext: (e: React.MouseEvent) => void;
  onPrev: (e: React.MouseEvent) => void;
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';
  const safeImages = images.length > 0 ? images : [defaultImage];

  return (
    <div className="relative h-48 w-full overflow-hidden group">
      <img
        src={safeImages[0]}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== defaultImage) {
            target.src = defaultImage;
          }
        }}
      />
      
      {safeImages.length > 1 && (
        <>
          <button 
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Image précédente"
          >
            ❮
          </button>
          <button 
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Image suivante"
          >
            ❯
          </button>
        </>
      )}
    </div>
  );
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  description,
  images = [],
  price_per_night,
  price,
  city,
  region,
  amenities = [],
  type,
  className = '',
  onBook,
  onImageClick,
  onViewDetails,
  showActions = true,
  rating = 0,
  featured = false
}) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    guests: 1
  });

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Logique de navigation des images
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Logique de navigation des images
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBook) {
      onBook();
    } else {
      setIsBookingOpen(true);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Normaliser le type pour le système de réservation (Login -> ServiceReservation)
    const normalizedBookingType = (() => {
      switch (type) {
        case 'hotels':
          return 'hotel';
        case 'apartments':
          return 'appartement';
        case 'villas':
          return 'villa';
        case 'car_rentals':
          return 'voiture';
        case 'circuit_touristiques':
          return 'circuit';
        default:
          return 'service';
      }
    })();

    // Stocker une réservation en attente (prioritaire) pour reprise après login
    sessionStorage.setItem(
      'pendingReservation',
      JSON.stringify({
        formData: {
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          guests: bookingData.guests
        },
        serviceId: id,
        serviceType: normalizedBookingType
      })
    );

    navigate('/login', {
      state: {
        from: window.location.pathname,
        fromReservation: true
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value, 10) : value
    }));
  };

  const servicePath = type || 'hotels';
  const serviceIcon = getServiceIcon(type || 'hotels');
  const displayPriceValue = price_per_night || price;
  const displayPrice = displayPriceValue ? `${displayPriceValue} MAD` : 'Sur demande';
  const locationText = [city, region].filter(Boolean).join(', ');

  const handleImageClick = (e: React.MouseEvent) => {
    if (onImageClick) {
      e.preventDefault();
      e.stopPropagation();
      onImageClick();
    }
  };

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}
      whileHover={{ y: -5 }}
    >
      {onImageClick ? (
        <>
          <div 
            className="relative h-48 overflow-hidden group cursor-pointer"
            onClick={handleImageClick}
          >
            <ImageSlider 
              images={images}
              title={title}
              onNext={nextImage}
              onPrev={prevImage}
            />
            
            {featured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                En vedette
              </div>
            )}
            
            <button 
              onClick={toggleFavorite}
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
              />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                {title}
              </h3>
              {rating > 0 && (
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-teal-700">{displayPrice}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewDetails) {
                    onViewDetails();
                  } else {
                    window.location.href = `/${servicePath}/${id}`;
                  }
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Voir détails →
              </button>
            </div>
          </div>
        </>
      ) : (
        <Link to={`/${servicePath}/${id}`} className="block">
          <div className="relative h-48 overflow-hidden group cursor-pointer">
            <ImageSlider 
              images={images}
              title={title}
              onNext={nextImage}
              onPrev={prevImage}
            />
            
            {featured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                En vedette
              </div>
            )}
            
            <button 
              onClick={toggleFavorite}
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
              />
            </button>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                {title}
              </h3>
              <div className="flex items-center">
                {rating > 0 && (
                  <div className="flex items-center mr-2">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                  {serviceIcon}
                  <span className="capitalize">{type?.replace('_', ' ') || 'service'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1" title={locationText}>{locationText}</span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={description}>
              {description}
            </p>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {amenities.slice(0, 3).map((amenity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center"
                    title={amenity}
                  >
                    {getAmenityIcon(amenity)}
                    <span className="truncate max-w-[80px]">{amenity}</span>
                  </span>
                ))}
                {amenities.length > 3 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    +{amenities.length - 3} plus
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center">
                <span className="text-lg font-bold text-teal-700">{displayPrice}</span>
                {(price_per_night || price) && <span className="text-xs text-gray-500 ml-1">/nuit</span>}
              </div>
              
              {showActions && (
                <button
                  onClick={handleBookNow}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Réserver
                </button>
              )}
            </div>
          </div>
        </Link>
      )}

      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.form 
              onSubmit={handleBookingSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Réserver {title}</h3>
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                  <div className="grid grid-cols-2 gap-2 relative">
                    <div className="relative">
                      <input
                        type="date"
                        name="startDate"
                        value={bookingData.startDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-3 pr-8 py-2 border rounded-md"
                        required
                      />
                      <CalendarIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        name="endDate"
                        value={bookingData.endDate}
                        onChange={handleInputChange}
                        min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full pl-3 pr-8 py-2 border rounded-md"
                        required
                      />
                      <CalendarIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voyageurs</label>
                  <select
                    name="guests"
                    value={bookingData.guests}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md appearance-none"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} {num > 1 ? 'voyageurs' : 'voyageur'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Continuer vers le paiement
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceCard;