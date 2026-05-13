import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RestaurantCardProps {
  id: string;
  title: string;
  description: string;
  cuisine_type?: string;
  price_range?: string;
  location: string;
  rating: number;
  image: string;
  onBook?: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  title,
  description,
  cuisine_type,
  price_range,
  location,
  rating,
  image,
  onBook
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {cuisine_type && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
            {cuisine_type}
          </div>
        )}
        <div className="absolute top-4 right-4 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          {rating.toFixed(1)}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{title}</h3>
          <span className="text-emerald-600 font-medium">{price_range || '$$'}</span>
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-3 gap-1">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
          {description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <Link 
            to={`/services/restaurants/${id}`}
            className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
          >
            Voir le menu
          </Link>
          <button
            onClick={onBook}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
