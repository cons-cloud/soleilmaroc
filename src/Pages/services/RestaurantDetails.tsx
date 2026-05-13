import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { ArrowLeft, Clock, MapPin, Utensils, Star, Phone } from 'lucide-react';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { property, loading, error } = usePropertyDetails('restaurant', id);

  const handleBookTable = () => {
    if (!property || !id) return;
    navigate(`/services/restaurants/${id}/reserver`, {
      state: {
        service: {
          id: property.id,
          title: property.title || property.name,
          description: property.description || '',
          price: 0,
          images: Array.isArray(property.images) ? property.images : [],
          type: 'restaurant'
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant non trouvé</h2>
          <p className="text-gray-600 mb-6">{error?.message || "Désolé, ce restaurant n'existe pas ou plus."}</p>
          <button
            onClick={() => navigate('/services/restaurants')}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
          >
            Découvrir d'autres restaurants
          </button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(property.images) ? property.images : [];
  const menu = Array.isArray(property.menu) ? property.menu : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-[400px] md:h-[500px]">
        <img 
          src={images[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'} 
          alt={property.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute top-6 left-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white transition-all active:scale-90"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      {property.cuisine_type || 'Gastronomie'}
                    </span>
                    <div className="flex items-center text-amber-500 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      {property.rating?.toFixed(1) || '5.0'}
                    </div>
                  </div>
                  <h1 className="text-4xl font-black text-gray-900">{property.name}</h1>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-600 block">{property.price_range || '$$'}</span>
                  <span className="text-sm text-gray-500">Gamme de prix</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-2xl">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Localisation</p>
                    <p className="text-sm font-semibold">{property.address || property.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-2xl">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Horaires</p>
                    <p className="text-sm font-semibold">12:00 - 23:00</p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">À propos</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {property.description}
              </p>

              {/* Menu Section */}
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-emerald-600" />
                La Carte
              </h2>
              {menu.length > 0 ? (
                <div className="space-y-4">
                  {menu.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start p-4 hover:bg-gray-50 rounded-2xl transition-colors border-b border-gray-100 last:border-0 border-dashed">
                      <div>
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <span className="font-bold text-emerald-600 text-lg">{item.price} MAD</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 italic">Le menu complet sera bientôt disponible en ligne.</p>
                </div>
              )}
            </div>

            {/* Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.slice(1).map((img: string, idx: number) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`${property.name} - ${idx + 2}`}
                    className="w-full h-48 object-cover rounded-2xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Réserver une table</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <Utensils className="h-4 w-4 text-emerald-600" />
                  <span className="text-gray-600">Confirmation immédiate</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Star className="h-4 w-4 text-emerald-600" />
                  <span className="text-gray-600">Meilleure table garantie</span>
                </div>
              </div>

              <button
                onClick={handleBookTable}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl hover:bg-emerald-700 transition-all font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 mb-4"
              >
                Réserver maintenant
              </button>
              
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-widest">OU PAR TÉLÉPHONE</p>
                <a 
                  href={`tel:${property.contact_phone || '+212600000000'}`}
                  className="flex items-center justify-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {property.contact_phone || '+212 6 00 00 00 00'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
