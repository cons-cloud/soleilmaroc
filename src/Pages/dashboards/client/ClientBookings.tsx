import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Interface pour les réservations
interface Booking {
  id: string;
  client_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  start_date: string;
  end_date?: string;
  guests?: number;
  total_price?: number;
  reference?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  service_title?: string;
  service_image?: string | null;
  service_type?: string;
  created_at: string;
  updated_at: string;
}

const ClientBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  // Fonction pour charger les réservations
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        console.log('Aucun utilisateur connecté');
        setError('Veuillez vous connecter pour voir vos réservations');
        setLoading(false);
        return;
      }

      console.log('Récupération des réservations pour l\'utilisateur:', user.id);
      
      // 1. Récupérer d'abord les réservations avec une meilleure gestion des erreurs
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Résultats de la requête bookings:', { bookingsData, bookingsError });

      if (bookingsError) {
        console.error('Erreur lors de la récupération des réservations:', {
          message: bookingsError.message,
          code: bookingsError.code,
          details: bookingsError.details,
          hint: bookingsError.hint
        });
        
        if (bookingsError.code === '42501') { // Erreur de permission
          setError('Vous n\'avez pas les permissions nécessaires pour voir ces réservations');
        } else {
          throw new Error(`Erreur lors du chargement des réservations: ${bookingsError.message}`);
        }
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        console.log('Aucune réservation trouvée pour cet utilisateur');
        setBookings([]);
        setError(null);
        setLoading(false);
        return;
      }

      // 2. Grouper les réservations par type de service
      const bookingsByType: { [key: string]: any[] } = {};
      bookingsData.forEach((booking: any) => {
        const serviceType = booking.service_type || 'service';
        if (!bookingsByType[serviceType]) {
          bookingsByType[serviceType] = [];
        }
        bookingsByType[serviceType].push(booking);
      });

      // 3. Récupérer les services depuis les bonnes tables
      const servicesMap = new Map();

      // Helper: mapping service_type -> partner_products.product_type
      const mapToPartnerProductType = (serviceType: string) => {
        switch (serviceType) {
          case 'hotels':
          case 'hotel':
            return 'hotel';
          case 'appartement':
          case 'apartment':
          case 'appartements':
            return 'appartement';
          case 'villa':
          case 'villas':
            return 'villa';
          case 'voiture':
          case 'car':
          case 'voitures':
          case 'cars':
            return 'voiture';
          case 'circuit':
          case 'tourism':
          case 'tour':
          case 'circuits':
            return 'circuit';
          default:
            return null;
        }
      };
      
      for (const [serviceType, bookings] of Object.entries(bookingsByType)) {
        const serviceIds = bookings
          .map(b => b.service_id)
          .filter((id): id is string => !!id);
        
        if (serviceIds.length === 0) continue;

        let tableName = 'services';
        switch (serviceType) {
          case 'hotel':
          case 'hotels':
            tableName = 'hotels';
            break;
          case 'appartement':
          case 'apartment':
          case 'appartements':
            tableName = 'appartements';
            break;
          case 'villa':
          case 'villas':
            tableName = 'villas';
            break;
          case 'voiture':
          case 'car':
          case 'voitures':
          case 'cars':
            tableName = 'locations_voitures';
            break;
          case 'circuit':
          case 'tourism':
          case 'tour':
          case 'circuits':
            tableName = 'circuits_touristiques';
            break;
        }

        try {
          const { data: services, error: servicesError } = await supabase
            .from(tableName)
            .select('*')
            .in('id', serviceIds);

          if (servicesError) {
            console.error(`Erreur lors de la récupération des ${serviceType}:`, servicesError);
            // On continue : on tentera partner_products en fallback
          }

          if (services) {
            services.forEach((service: any) => {
              servicesMap.set(service.id, {
                ...service,
                title: service.title || service.name || 'Sans titre',
                image_url: service.images?.[0] || service.image || service.image_url || null,
                type: serviceType
              });
            });
          }

          // Fallback: si certains ids ne sont pas trouvés (produits partenaires),
          // tenter de charger depuis partner_products.
          const missingIds = serviceIds.filter((id) => !servicesMap.has(id));
          const partnerProductType = mapToPartnerProductType(serviceType);
          if (missingIds.length > 0 && partnerProductType) {
            const { data: partnerProducts, error: partnerError } = await supabase
              .from('partner_products')
              .select('*')
              .in('id', missingIds)
              .eq('product_type', partnerProductType);

            if (partnerError) {
              // Non bloquant
              console.warn(`Erreur lors de la récupération partner_products (${serviceType}):`, partnerError);
            }

            if (partnerProducts) {
              partnerProducts.forEach((p: any) => {
                servicesMap.set(p.id, {
                  ...p,
                  title: p.title || p.name || 'Sans titre',
                  image_url: (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.main_image) || null,
                  type: serviceType,
                  is_partner: true,
                  partner_id: p.partner_id
                });
              });
            }
          }
        } catch (err) {
          console.error(`Erreur lors du chargement des ${serviceType}:`, err);
        }
      }

      // 4. Combiner les données
      const formattedBookings = bookingsData.map((booking: any) => {
        const service = booking.service_id ? servicesMap.get(booking.service_id) : null;
        return {
          ...booking,
          service_title: service?.title || booking.service_title || 'Service inconnu',
          service_image: service?.image_url || service?.images?.[0] || null,
          service_type: booking.service_type || service?.type || 'service',
          start_date: booking.start_date || booking.created_at,
          end_date: booking.end_date || null,
          total_price: booking.total_price || 0,
          status: booking.status || 'pending'
        };
      });

      // 5. Appliquer le filtre
      const filteredBookings = filter === 'all' 
        ? formattedBookings 
        : formattedBookings.filter((booking: any) => booking.status === filter);

      setBookings(filteredBookings);
      
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
      setError('Une erreur est survenue lors du chargement de vos réservations. Veuillez réessayer plus tard.');
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  // Configurer l'abonnement en temps réel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadBookings]);

  // Charger les réservations au montage et quand le filtre change
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Fonction pour annuler une réservation
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('client_id', user?.id); // S'assurer que l'utilisateur ne peut annuler que ses propres réservations

      if (error) throw error;
      
      // Mettre à jour l'état local
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { 
          ...booking, 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        } : booking
      ));
      
      toast.success('Réservation annulée avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la réservation:', err);
      toast.error('Une erreur est survenue lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  // Rendu conditionnel
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8">
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
                <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à vos réservations.</p>
                <Link 
                  to="/connexion" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8">
              <div className="text-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Chargement de vos réservations...</h2>
                <p className="text-gray-500 mt-2">Veuillez patienter un instant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8">
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-red-800">Erreur de chargement</h3>
                <p className="mt-2 text-red-600">{error}</p>
                <button
                  onClick={loadBookings}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
                <p className="text-gray-500 mb-6">
                  {filter === 'all' 
                    ? "Vous n'avez pas encore effectué de réservation. Parcourez nos services pour commencer."
                    : "Aucune réservation ne correspond à ce filtre."}
                </p>
                <Link 
                  to="/services" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Découvrir nos services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
              <p className="mt-1 text-sm text-gray-500">
                Consultez l'état de vos réservations et gérez vos prochains voyages
              </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  filter === 'all' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  filter === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  filter === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Confirmées
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  filter === 'cancelled' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Annulées
              </button>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      {booking.service_image && (
                        <div className="w-full md:w-40 h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={booking.service_image} 
                            alt={booking.service_title || 'Image du service'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.service_title || 'Service inconnu'}
                        </h3>
                        <div className="mt-1 text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {booking.reference && (
                          <div className="mt-1 text-sm text-gray-500">
                            Référence: {booking.reference}
                          </div>
                        )}
                        <div className="mt-2">
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {booking.status === 'confirmed' 
                              ? 'Confirmé' 
                              : booking.status === 'cancelled'
                              ? 'Annulé'
                              : booking.status === 'completed'
                              ? 'Terminé'
                              : 'En attente'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">
                          {booking.total_price?.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' }) || 'Prix non disponible'}
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <Link
                            to={`/mes-reservations/${booking.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          >
                            Voir les détails
                          </Link>
                          
                          {!['cancelled', 'completed', 'refunded'].includes(booking.status) && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 ml-2"
                              disabled={loading}
                            >
                              {loading ? 'Traitement...' : 'Annuler'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBookings;