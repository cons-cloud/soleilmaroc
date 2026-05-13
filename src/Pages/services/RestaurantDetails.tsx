import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Clock, MapPin, Utensils, Star, Phone, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import BookingModal from '../../components/BookingModal';

const RestaurantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchRestaurant = async () => {
    if (!id) return;
    try {
      const { data, error: queryError } = await supabase
        .from('restaurants_marocsoleil')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (queryError) throw queryError;
      if (!data) throw new Error('Restaurant non trouvé');
      setRestaurant(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  // Real-time subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`restaurant-details-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants_marocsoleil',
        filter: `id=eq.${id}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRestaurant(payload.new);
        } else if (payload.eventType === 'DELETE') {
          navigate('/restaurants');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant introuvable</h2>
          <p className="text-gray-500 mb-6">{error || "Ce restaurant n'existe pas ou plus."}</p>
          <button
            onClick={() => navigate('/restaurants')}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-semibold"
          >
            Retour aux restaurants
          </button>
        </div>
      </div>
    );
  }

  const name = restaurant.name || restaurant.title || 'Restaurant';
  const images: string[] = Array.isArray(restaurant.images) ? restaurant.images.filter(Boolean) : [];
  const mainImage = images[0] || restaurant.main_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
  const menu: any[] = Array.isArray(restaurant.menu) ? restaurant.menu : [];
  const rating = typeof restaurant.rating === 'number' ? restaurant.rating : parseFloat(restaurant.rating) || 0;

  const prevImage = () => setCurrentImageIndex(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setCurrentImageIndex(i => (i + 1) % images.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image with carousel */}
      <div className="relative h-[420px] md:h-[520px] overflow-hidden">
        <img
          src={images[currentImageIndex] || mainImage}
          alt={name}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white transition-all active:scale-90 flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </button>
        </div>

        {/* Image carousel controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <div className="flex flex-wrap gap-2 mb-2">
            {restaurant.cuisine_type && (
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                {restaurant.cuisine_type}
              </span>
            )}
            {restaurant.available === true && (
              <span className="px-3 py-1 bg-green-400 text-white rounded-full text-xs font-bold uppercase">
                Ouvert
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{name}</h1>
          {restaurant.city && (
            <div className="flex items-center gap-2 mt-2 text-white/80">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{restaurant.address || restaurant.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Info card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {rating > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                      <Star className="w-5 h-5 text-amber-500 fill-current" />
                      <span className="font-bold text-amber-700 text-lg">{rating.toFixed(1)}</span>
                    </div>
                  )}
                  {restaurant.price_range && (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                      <span className="font-bold text-emerald-700 text-lg">{restaurant.price_range}</span>
                      <span className="text-xs text-emerald-600">gamme</span>
                    </div>
                  )}
                  {restaurant.capacity && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{restaurant.capacity} couverts</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {(restaurant.address || restaurant.city) && (
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                    <MapPin className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Adresse</p>
                      <p className="text-sm font-semibold text-gray-800">{restaurant.address || restaurant.city}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                  <Clock className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Horaires</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {restaurant.opening_hours?.weekdays || '12:00 – 23:00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {restaurant.description && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">À propos</h2>
                  <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">{restaurant.description}</p>
                </>
              )}

              {/* ── MENU SECTION ── */}
              <div className="border-t border-gray-100 pt-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                  </span>
                  Notre Carte
                </h2>

                {menu.length > 0 ? (
                  <div className="space-y-3">
                    {menu.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="group flex justify-between items-start gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {item.name || 'Plat sans nom'}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {item.price != null && (
                            <span className="font-bold text-emerald-600 text-lg whitespace-nowrap">
                              {Number(item.price).toFixed(0)} MAD
                            </span>
                          )}
                          {item.photo && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                              <img 
                                src={item.photo} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => { (e.target as HTMLImageElement).parentElement?.remove(); }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 italic">Le menu complet sera bientôt disponible en ligne.</p>
                    <p className="text-sm text-gray-400 mt-1">Contactez-nous pour plus d'informations.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Extra images gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.slice(1, 7).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${name} - vue ${idx + 2}`}
                    className="w-full h-44 object-cover rounded-2xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    onClick={() => setCurrentImageIndex(idx + 1)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Réserver une table</h3>
              <p className="text-sm text-gray-500 mb-6">Confirmation immédiate, meilleure place garantie.</p>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl hover:bg-emerald-700 transition-all font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 mb-4"
              >
                Réserver maintenant
              </button>

              {restaurant.contact_phone && (
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-widest">Ou par téléphone</p>
                  <a
                    href={`tel:${restaurant.contact_phone}`}
                    className="flex items-center justify-center gap-2 text-emerald-600 font-bold hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {restaurant.contact_phone}
                  </a>
                </div>
              )}

              {/* Info badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                {restaurant.cuisine_type && (
                  <div className="flex items-center gap-3 text-sm">
                    <Utensils className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-600">Cuisine <strong>{restaurant.cuisine_type}</strong></span>
                  </div>
                )}
                {restaurant.capacity && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-600">Capacité : <strong>{restaurant.capacity} personnes</strong></span>
                  </div>
                )}
                {restaurant.price_range && (
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-600">Gamme : <strong>{restaurant.price_range}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          service={{
            id: restaurant.id,
            type: 'restaurant' as any,
            title: name,
            price: 0,
            image: mainImage,
            description: restaurant.description || '',
            capacity: restaurant.capacity || 2,
          }}
        />
      )}
    </div>
  );
};

export default RestaurantDetails;
