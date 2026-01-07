import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, CreditCard, Loader, Utensils, Bed, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import AuthGuard from './AuthGuard';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    type: 'hebergement' | 'voiture' | 'circuit';
    title: string;
    price: number;
    image?: string;
    description?: string;
    capacity?: number;
    amenities?: string[];
  };
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
 
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    guests: 1,
    fullName: user?.user_metadata?.['full_name'] || '',
    email: user?.email || '',
    phone: user?.user_metadata?.['phone'] || '',
    specialRequests: '',
    roomType: 'standard',
    breakfastIncluded: false
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.['full_name'] || prev.fullName,
        phone: user.user_metadata?.['phone'] || prev.phone,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateTotalPrice = () => {
    const days = calculateDays();
    const basePrice = service.price * days * formData.guests;
    const breakfastPrice = formData.breakfastIncluded ? 150 * days * formData.guests : 0;
    return basePrice + breakfastPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return; // Le AuthGuard gérera l'affichage de la modale de connexion
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Veuillez sélectionner des dates valides');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    setLoading(true);

    try {
      const totalPrice = calculateTotalPrice();
      
      const reservationData = {
        user_id: user.id,
        service_type: service.type,
        service_id: service.id,
        start_date: formData.startDate,
        end_date: formData.endDate,
        guests: formData.guests,
        room_type: formData.roomType,
        breakfast_included: formData.breakfastIncluded,
        total_price: totalPrice,
        status: 'en_attente',
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        special_requests: formData.specialRequests
      };

      const { data, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select();

      if (error) throw error;
      
      toast.success('Réservation réussie !');
      navigate(ROUTES.PAYMENT, { 
        state: { 
          reservation: data[0],
          serviceDetails: service
        } 
      });

    } catch (error: any) {
      console.error('Erreur de réservation:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-white/50 backdrop-blur-sm" 
          aria-hidden="true"
          onClick={onClose}
        />
        
        <div className="inline-block align-bottom bg-white/95 backdrop-blur-md rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Réserver un séjour</h2>
              <p className="text-sm text-gray-500">{service.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {service.image && (
            <div className="px-6 pt-4">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Bed className="h-4 w-4 mr-2 text-emerald-500" />
                  Type de chambre
                </label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="standard">Chambre Standard</option>
                  <option value="superior">Chambre Supérieure</option>
                  <option value="deluxe">Chambre Deluxe</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="breakfast"
                    checked={formData.breakfastIncluded}
                    onChange={(e) => setFormData({...formData, breakfastIncluded: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="breakfast" className="ml-2 block text-sm text-gray-700 flex items-center">
                    <Utensils className="h-4 w-4 mr-1" />
                    Petit-déjeuner inclus (+150 MAD/pers/nuit)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-semibold text-gray-700 flex items-center">
                <User className="h-5 w-5 mr-2 text-emerald-500" />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de personnes
                  </label>
                  <div className="relative">
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} {num > 1 ? 'personnes' : 'personne'}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'arrivée
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de départ
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demandes spéciales (optionnel)
              </label>
              <textarea
                rows={3}
                value={formData.specialRequests}
                onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                placeholder="Avez-vous des demandes particulières pour votre séjour ?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Récapitulatif</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {service.price} MAD x {calculateDays()} nuit{calculateDays() > 1 ? 's' : ''} x {formData.guests} {formData.guests > 1 ? 'personnes' : 'personne'}
                  </span>
                  <span>{(service.price * calculateDays() * formData.guests).toFixed(2)} MAD</span>
                </div>
                
                {formData.breakfastIncluded && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Petit-déjeuner ({formData.guests} pers. x {calculateDays()} nuit{calculateDays() > 1 ? 's' : ''})
                    </span>
                    <span>+{(150 * formData.guests * calculateDays()).toFixed(2)} MAD</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-emerald-600">{calculateTotalPrice().toFixed(2)} MAD</span>
                </div>
              </div>
              
              <p className="mt-3 text-xs text-gray-500">
                Le montant total sera prélevé à la fin de votre séjour.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              
              <AuthGuard>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex-1 flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="-ml-1 mr-2 h-5 w-5" />
                      <span>Confirmer la réservation</span>
                    </>
                  )}
                </button>
              </AuthGuard>
            </div>
            
            <p className="text-center text-xs text-gray-500">
              Paiement sécurisé via Stripe
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;