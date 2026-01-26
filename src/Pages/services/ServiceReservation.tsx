import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ROUTES } from '../../config/routes';
import { toast } from 'react-hot-toast';
import { Calendar, Mail, Phone, ArrowLeft, CheckCircle, User } from 'lucide-react';

interface UserMetadata {
  full_name?: string;
  phone?: string;
  [key: string]: any;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  [key: string]: any;
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
  type: string;
  source?: 'admin' | 'partner';
  partner_id?: string;
  [key: string]: any;
}

interface FormData {
  startDate: string;
  endDate: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  roomType?: string;
  breakfastIncluded?: boolean;
}

const ServiceReservation: React.FC = () => {
  const { type, id } = useParams<{ type?: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth() as { user: User | null };
  
  // Déterminer le type depuis l'URL ou le state
  // Si on est sur /tourisme/:id/reserver, le type est 'tourisme'
  // Si on est sur /villas/:id/reserver, le type est 'villa'
  const pathParts = location.pathname.split('/').filter(Boolean);
  let detectedType = type;
  
  if (!detectedType && pathParts.length >= 2) {
    const pathType = pathParts[0]; // 'tourisme', 'villas', 'hotels', etc.
    // Mapper les chemins vers les types de service
    if (pathType === 'tourisme') {
      detectedType = 'tourism';
    } else if (pathType === 'villas') {
      detectedType = 'villa';
    } else if (pathType === 'hotels') {
      detectedType = 'hotel';
    } else if (pathType === 'appartements') {
      detectedType = 'apartment';
    } else if (pathType === 'voitures') {
      detectedType = 'car';
    } else {
      detectedType = pathType;
    }
  }
  
  const serviceType = detectedType || 'service';

  const [service, setService] = useState<ServiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    startDate: '',
    endDate: '',
    guests: 1,
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
    roomType: 'standard',
    breakfastIncluded: false
  });

  const fetchService = useCallback(async (): Promise<void> => {
    if (!id) {
      toast.error('Service non trouvé');
      navigate(ROUTES.HOME);
      return;
    }
    
    // Utiliser le type déterminé depuis l'URL ou le state
    const currentType = type || serviceType;

    try {
      setIsLoading(true);

      // Vérifier si des données de formulaire sont passées depuis la page de connexion
      const state = location.state as any;
      if (state?.formData) {
        setFormData(prev => ({
          ...prev,
          ...state.formData
        }));
      }
      
      // Vérifier aussi sessionStorage pour une réservation en attente (après connexion ou inscription)
      if (state?.fromLogin || state?.fromSignup) {
        const pendingReservation = sessionStorage.getItem('pendingReservation');
        if (pendingReservation) {
          try {
            const pending = JSON.parse(pendingReservation);
            if (pending.formData) {
              setFormData(prev => ({
                ...prev,
                ...pending.formData
              }));
            }
            // Supprimer après utilisation
            sessionStorage.removeItem('pendingReservation');
            toast.success('Vos informations de réservation ont été restaurées');
          } catch (e) {
            console.error('Erreur lors de la restauration depuis sessionStorage:', e);
            sessionStorage.removeItem('pendingReservation');
          }
        }
      }

      // Déterminer la table en fonction du type de service
      let tableName = '';
      
      switch (currentType) {
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
        case 'hebergements':
          tableName = 'hebergements';
          break;
        default:
          tableName = 'services';
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // Fallback: si pas trouvé dans la table principale, tenter partner_products
      let finalData: any = data;
      let source: 'admin' | 'partner' = 'admin';

      if (!finalData) {
        const partnerProductType = (() => {
          switch (tableName) {
            case 'hotels':
              return 'hotel';
            case 'appartements':
              return 'appartement';
            case 'villas':
              return 'villa';
            case 'locations_voitures':
              return 'voiture';
            case 'circuits_touristiques':
              return 'circuit';
            default:
              return null;
          }
        })();

        if (partnerProductType) {
          const partnerRes = await supabase
            .from('partner_products')
            .select('*')
            .eq('id', id)
            .eq('product_type', partnerProductType)
            .maybeSingle();

          if (partnerRes.data) {
            finalData = partnerRes.data;
            source = 'partner';
          } else if (partnerRes.error) {
            // Non bloquant: si on ne trouve pas côté partner, on garde la logique "non trouvé"
            console.warn('[ServiceReservation] partner_products fallback error:', partnerRes.error);
          }
        }
      }

      if (error && !finalData) throw error;
      if (!finalData) throw new Error('Service non trouvé');

      // Mapper les données du service selon le type
      let title = '';
      let price = 0;
      
      if (source === 'partner') {
        // Données provenant de partner_products
        title = finalData.title || finalData.name || 'Sans titre';
        // partner_products utilise souvent "price"
        price =
          finalData.price_per_night ||
          finalData.price_per_day ||
          finalData.price_per_person ||
          finalData.price ||
          0;
      } else {
        // Données provenant des tables admin
        if (tableName === 'hotels') {
          title = finalData.name || 'Sans titre';
          price = finalData.price_per_night || 0;
        } else if (tableName === 'appartements' || tableName === 'villas') {
          title = finalData.title || 'Sans titre';
          price = finalData.price_per_night || 0;
        } else if (tableName === 'locations_voitures') {
          title = `${finalData.brand || ''} ${finalData.model || ''} ${finalData.year ? finalData.year : ''}`.trim();
          price = finalData.price_per_day || 0;
        } else if (tableName === 'circuits_touristiques') {
          title = finalData.title || 'Sans titre';
          price = finalData.price_per_person || 0;
        } else {
          title = finalData.nom || finalData.titre || finalData.name || finalData.title || 'Sans titre';
          price = finalData.prix || finalData.prix_nuit || finalData.prix_jour || finalData.price_per_night || finalData.price_per_day || finalData.price_per_person || finalData.price || 0;
        }
      }

      setService({
        id: finalData.id,
        title: title,
        description: finalData.description || finalData.details || '',
        price: price,
        images: finalData.images || (finalData.image_url ? [finalData.image_url] : []) || (finalData.main_image ? [finalData.main_image] : []) || [],
        type: currentType,
        source,
        partner_id: source === 'partner' ? finalData.partner_id : undefined
      });

      // Pré-remplir les champs si l'utilisateur est connecté
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.['full_name'] || '',
          email: user.email || '',
          phone: user.user_metadata?.['phone'] || ''
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du service:', error);
      toast.error('Erreur lors du chargement du service');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  }, [id, type, serviceType, user, navigate, location.state]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const calculateNights = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des dates selon le type de service
    const currentType = type || serviceType;
    const isAccommodation = ['hotel', 'hotels', 'appartement', 'apartment', 'appartements', 'villa', 'villas'].includes(currentType);
    const isCar = ['voiture', 'car', 'voitures', 'cars'].includes(currentType);
    const isCircuit = ['circuit', 'tourism', 'tour', 'circuits'].includes(currentType);
    
    if (isAccommodation || isCar) {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Veuillez sélectionner les dates');
        return;
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('La date de fin doit être postérieure à la date de début');
        return;
      }
    } else if (isCircuit) {
      if (!formData.startDate) {
        toast.error('Veuillez sélectionner la date de départ');
        return;
      }
    }

    if (!user) {
      // Sauvegarder les données du formulaire avant la redirection
      const currentType = type || serviceType;
      sessionStorage.setItem('pendingReservation', JSON.stringify({
        formData,
        serviceId: id,
        serviceType: currentType
      }));

      navigate(ROUTES.LOGIN, { 
        state: { 
          from: location.pathname,
          fromReservation: true,
          reservationData: formData
        } 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculer le prix total selon le type de service
      const currentType = type || serviceType;
      let totalPrice = 0;
      let days = 0;
      
      if (currentType === 'voiture' || currentType === 'car' || currentType === 'voitures' || currentType === 'cars') {
        // Pour les voitures, calculer par jour
        days = calculateNights(formData.startDate, formData.endDate);
        totalPrice = service ? service.price * days : 0;
      } else if (currentType === 'circuit' || currentType === 'tourism' || currentType === 'tour' || currentType === 'circuits') {
        // Pour les circuits, prix par personne
        totalPrice = service ? service.price * formData.guests : 0;
      } else {
        // Pour les hébergements (hôtels, appartements, villas), calculer par nuit
        days = calculateNights(formData.startDate, formData.endDate);
        let basePrice = service ? service.price * days : 0;
        let breakfastPrice = formData.breakfastIncluded ? 150 * days : 0;
        totalPrice = basePrice + breakfastPrice;
      }

      // Normaliser le service_type pour la table bookings
      let normalizedType = currentType;
      if (['appartement', 'apartment', 'appartements'].includes(currentType)) normalizedType = 'appartement';
      else if (['villa', 'villas'].includes(currentType)) normalizedType = 'villa';
      else if (['voiture', 'car', 'voitures', 'cars'].includes(currentType)) normalizedType = 'voiture';
      else if (['circuit', 'tourism', 'tour', 'circuits'].includes(currentType)) normalizedType = 'circuit';
      else if (['hotel', 'hotels'].includes(currentType)) normalizedType = 'hotel';

      // Créer la réservation dans la table bookings
      const { data: reservation, error } = await supabase
        .from('bookings')
        .insert([{
          client_id: user.id,
          service_type: normalizedType,
          service_id: service?.id,
          // Important pour les produits partenaire
          ...(service?.source === 'partner' && service?.partner_id ? { partner_id: service.partner_id } : {}),
          start_date: formData.startDate,
          end_date: formData.endDate,
          guests: formData.guests,
          total_price: totalPrice,
          status: 'pending',
          payment_status: 'pending',
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          special_requests: formData.specialRequests,
          room_type: formData.roomType,
          breakfast_included: formData.breakfastIncluded
        }])
        .select()
        .single();

      if (error) throw error;

      // Rediriger vers la page de paiement avec les détails de la réservation
      navigate(ROUTES.PAYMENT, {
        state: {
          bookingId: reservation.id,
          reservationId: reservation.id,
          bookingType: normalizedType,
          serviceId: service?.id,
          serviceType: normalizedType,
          serviceTitle: service?.title,
          totalPrice: totalPrice,
          startDate: formData.startDate,
          endDate: formData.endDate,
          guests: formData.guests,
          customerInfo: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          },
          formData: formData
        }
      });

      toast.success('Réservation créée avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      toast.error(error.message || 'Erreur lors de la création de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full max-w-2xl">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Service introuvable. Veuillez réessayer ou contacter le support.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-red-50 text-sm font-medium text-red-700 hover:text-red-600"
                >
                  <span aria-hidden="true">&larr;</span> Retour
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nights = calculateNights(formData.startDate, formData.endDate);
  const totalPrice = service.price * nights * formData.guests;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center text-emerald-600 hover:text-emerald-700"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Réservation de {service?.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Remplissez les détails de votre réservation</p>
          </div>

          <div className="px-4 py-5 sm:p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Détails de la réservation</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Date d'arrivée <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Date de départ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                            required
                            disabled={!formData.startDate}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de voyageurs <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            name="guests"
                            id="guests"
                            min="1"
                            value={formData.guests}
                            onChange={handleInputChange}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">
                          Type de chambre <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="roomType"
                          name="roomType"
                          value={formData.roomType}
                          onChange={handleInputChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                          required
                        >
                          <option value="standard">Standard</option>
                          <option value="superior">Supérieure</option>
                          <option value="deluxe">Deluxe</option>
                          <option value="suite">Suite</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="breakfastIncluded"
                          name="breakfastIncluded"
                          type="checkbox"
                          checked={formData.breakfastIncluded}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label htmlFor="breakfastIncluded" className="ml-2 block text-sm text-gray-700">
                          Petit-déjeuner inclus (+150 MAD/nuit)
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Informations personnelles</h3>
                      <p className="text-sm text-gray-500 mb-4">Ces informations seront utilisées pour vous contacter concernant votre réservation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          Nom complet <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5"
                            placeholder="+212 6 12 34 56 78"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                          Demandes spéciales (facultatif)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <textarea
                            id="specialRequests"
                            name="specialRequests"
                            rows={3}
                            value={formData.specialRequests}
                            onChange={handleInputChange}
                            className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-lg p-2.5"
                            placeholder="Avez-vous des demandes particulières ?"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Traitement...
                          </>
                        ) : 'Confirmer la réservation'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Panneau latéral */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
                  
                  {service && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        {service.images && service.images.length > 0 && (
                          <img
                            src={service.images[0]}
                            alt={service.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900">{service.title}</h4>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{service.description}</p>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Prix par nuit</span>
                              <span className="font-medium text-gray-900">{service.price} MAD</span>
                            </div>
                            
                            {formData.startDate && formData.endDate && (
                              <>
                                <div className="mt-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Durée du séjour</span>
                                    <span className="font-medium text-gray-900">
                                      {nights} nuit{nights > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  
                                  {formData.breakfastIncluded && (
                                    <div className="mt-1 flex justify-between text-sm">
                                      <span className="text-gray-500">Petit-déjeuner</span>
                                      <span className="font-medium text-gray-900">
                                        +{150 * nights} MAD
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <span>Total</span>
                                      <span>
                                        {totalPrice + (formData.breakfastIncluded ? 150 * nights : 0)} MAD
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                        <div className="flex">
                          <div className="shrink-0">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-emerald-800">Annulation gratuite</h4>
                            <p className="mt-1 text-sm text-emerald-700">Annulez sans frais jusqu'à 24h avant votre arrivée.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-2">
                        <p>En cliquant sur « Confirmer la réservation », vous acceptez les conditions générales de vente et la politique de confidentialité de Maroc 2030.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceReservation;