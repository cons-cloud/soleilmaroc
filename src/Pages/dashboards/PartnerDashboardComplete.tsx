import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import {
  Package,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';
import ProductForm from './partner/ProductForm';

interface PartnerStats {
  total_products: number;
  active_products: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  average_rating: number;
}

interface Product {
  id: string;
  title: string;
  product_type: string;
  price: number;
  city: string;
  available: boolean;
  views: number;
  bookings_count: number;
  rating: number;
  main_image: string;
  created_at: string;
}

interface Booking {
  id: string;
  service_title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_date: string | null;
  end_date: string | null;
  amount: number;
  payment_status: string;
  booking_status: string;
  partner_paid: boolean;
  partner_paid_at: string | null;
  created_at: string;
  earning_status: string;
}

const PartnerDashboardComplete: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bookings' | 'earnings' | 'profile'>('overview');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (user) loadDashboardData();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Stats RPC
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_partner_dashboard_stats', { p_partner_id: user?.id });

      if (statsError) {
        console.error('Erreur stats:', statsError);
      } else if (statsData) {
        const s = Array.isArray(statsData) ? statsData[0] : statsData;
        if (isMounted.current) setStats(s || null);
      }

      // Products
      const { data: productsData, error: productsError } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Erreur produits:', productsError);
      } else {
        const normalized = (productsData || []).map((p: any) => ({
          ...p,
          price: Number(p?.price ?? p?.prix ?? 0),
          available: p.available ?? true,
          main_image: p.main_image ?? p.image ?? '',
          bookings_count: p.bookings_count ?? 0,
          rating: p.rating ?? 0,
          views: p.views ?? 0,
        }));
        if (isMounted.current) setProducts(normalized);
      }

      // Bookings (view)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('partner_bookings_view')
        .select('*')
        .eq('partner_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Erreur réservations:', bookingsError);
      } else {
        if (isMounted.current) setBookings(bookingsData || []);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { color: string; label: string } } = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmé' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Annulé' },
      completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Terminé' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Payé' }
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const handleProductCreated = () => {
    loadDashboardData();
    setShowProductForm(false);
    toast.success('Produit créé et liste rafraîchie');
  };

  if (loading) {
    return (
      <DashboardLayout role="partner">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="partner">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {profile?.company_name || 'Partenaire'}</h1>
            <p className="text-gray-600 mt-1">Gérez vos produits et suivez vos revenus</p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Ajouter un produit
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_products ?? 0}</p>
                <p className="text-sm text-green-600 mt-1">{stats?.active_products ?? 0} actifs</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg"><Package className="w-8 h-8 text-emerald-600" /></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réservations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_bookings ?? 0}</p>
                <p className="text-sm text-yellow-600 mt-1">{stats?.pending_bookings ?? 0} en attente</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg"><Calendar className="w-8 h-8 text-purple-600" /></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{(stats?.pending_earnings ?? 0).toFixed(2)} MAD</p>
                <p className="text-xs text-gray-500 mt-1">À recevoir de MarocSoleil</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg"><Clock className="w-8 h-8 text-yellow-600" /></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gains reçus</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{(stats?.paid_earnings ?? 0).toFixed(2)} MAD</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois: {(stats?.this_month_earnings ?? 0).toFixed(2)} MAD</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg"><DollarSign className="w-8 h-8 text-green-600" /></div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-900">Information importante</h3>
              <p className="text-sm text-emerald-800 mt-1">
                Les montants affichés sont après déduction de la commission de 10% de MarocSoleil. Vous recevez 90% du montant total payé par les clients.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Vue d'ensemble</button>
              <button onClick={() => setActiveTab('products')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Mes Produits ({stats?.total_products ?? 0})</button>
              <button onClick={() => setActiveTab('bookings')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bookings' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Réservations ({stats?.total_bookings ?? 0})</button>
              <button onClick={() => setActiveTab('earnings')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'earnings' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Mes Gains</button>
              <button onClick={() => setActiveTab('profile')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Settings className="w-4 h-4 inline mr-2" />Profil</button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Réservations récentes</h3>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune réservation pour le moment</p>
                      <p className="text-sm text-gray-400 mt-2">Les réservations apparaîtront ici dès que des clients réserveront vos produits</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votre gain</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                          {bookings.slice(0, 5).map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{booking.service_title}</div></td>
                              <td className="px-6 py-4"><div className="text-sm text-gray-900">{booking.client_name}</div><div className="text-sm text-gray-500">{booking.client_email}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.start_date ? new Date(booking.start_date).toLocaleDateString('fr-FR') : ''}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-green-600">{(booking.amount ?? 0).toFixed(2)} MAD</div><div className="text-xs text-gray-500">(90% du total)</div></td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.booking_status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{booking.partner_paid ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" />Reçu</span> : <span className="flex items-center gap-1 text-yellow-600 text-sm"><Clock className="w-4 h-4" />En attente</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mes Produits</h3>
                  <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" />Ajouter un produit</button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun produit trouvé</p>
                    <p className="text-sm text-gray-400 mt-2">Vous n'avez pas encore ajouté de produit. Cliquez sur "Ajouter un produit" pour commencer.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{product.title}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500">{product.product_type}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-gray-900">{((product.price ?? 0)).toFixed(2)} MAD</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500">{product.city}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap">{product.available ? <span className="text-xs font-semibold text-green-600 bg-green-100 rounded-full px-3 py-1">Disponible</span> : <span className="text-xs font-semibold text-red-600 bg-red-100 rounded-full px-3 py-1">Indisponible</span>}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="text-indigo-600 hover:text-indigo-900 transition-colors">Modifier</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {showProductForm && (
                  <ProductForm onClose={() => setShowProductForm(false)} onCreate={handleProductCreated} editingProduct={editingProduct} />
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes Réservations</h3>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune réservation trouvée</p>
                      <p className="text-sm text-gray-400 mt-2">Vos réservations apparaîtront ici. Vous pouvez suivre l'état de chaque réservation.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{booking.service_title}</div></td>
                              <td className="px-6 py-4"><div className="text-sm text-gray-900">{booking.client_name}</div><div className="text-sm text-gray-500">{booking.client_email}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.start_date ? new Date(booking.start_date).toLocaleDateString('fr-FR') : ''}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-green-600">{(booking.amount ?? 0).toFixed(2)} MAD</div><div className="text-xs text-gray-500">(90% du total)</div></td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.booking_status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{booking.partner_paid ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" />Reçu</span> : <span className="flex items-center gap-1 text-yellow-600 text-sm"><Clock className="w-4 h-4" />En attente</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes Gains</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Résumé des Gains</h4>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1"><p className="text-sm text-gray-600">Ce mois</p><p className="text-2xl font-bold text-green-600">{(stats?.this_month_earnings ?? 0).toFixed(2)} MAD</p></div>
                        <div className="flex-1"><p className="text-sm text-gray-600">Total reçu</p><p className="text-2xl font-bold text-green-600">{(stats?.paid_earnings ?? 0).toFixed(2)} MAD</p></div>
                        <div className="flex-1"><p className="text-sm text-gray-600">En attente</p><p className="text-2xl font-bold text-yellow-600">{(stats?.pending_earnings ?? 0).toFixed(2)} MAD</p></div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Détails des Gains</h4>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Aucun gain enregistré</p>
                          <p className="text-sm text-gray-400 mt-2">Vos gains apparaîtront ici une fois que vous aurez des réservations payées.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                              {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{booking.service_title}</div></td>
                                  <td className="px-6 py-4"><div className="text-sm text-gray-900">{booking.client_name}</div><div className="text-sm text-gray-500">{booking.client_email}</div></td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.start_date ? new Date(booking.start_date).toLocaleDateString('fr-FR') : ''}</td>
                                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-green-600">{(booking.amount ?? 0).toFixed(2)} MAD</div><div className="text-xs text-gray-500">(90% du total)</div></td>
                                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.booking_status)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{booking.partner_paid ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" />Reçu</span> : <span className="flex items-center gap-1 text-yellow-600 text-sm"><Clock className="w-4 h-4" />En attente</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon Profil</h3>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><p className="text-sm text-gray-600">Nom de l'entreprise</p><p className="text-lg font-semibold text-gray-900">{profile?.company_name}</p></div>
                      <div><p className="text-sm text-gray-600">Email</p><p className="text-lg font-semibold text-gray-900">{user?.email}</p></div>
                      <div><p className="text-sm text-gray-600">Téléphone</p><p className="text-lg font-semibold text-gray-900">{profile?.phone}</p></div>
                      <div><p className="text-sm text-gray-600">Ville</p><p className="text-lg font-semibold text-gray-900">{profile?.city}</p></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier le Profil</h3>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
                    <form>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                          <input type="text" value={profile?.company_name ?? ''} className="mt-1 block w-full px-4 py-2 text-gray-900 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Nom de votre entreprise" readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input type="email" value={user?.email ?? ''} className="mt-1 block w-full px-4 py-2 text-gray-900 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Email associé à votre compte" disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                          <input type="text" value={profile?.phone ?? ''} className="mt-1 block w-full px-4 py-2 text-gray-900 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Votre numéro de téléphone" readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ville</label>
                          <input type="text" value={profile?.city ?? ''} className="mt-1 block w-full px-4 py-2 text-gray-900 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Votre ville" readOnly />
                        </div>
                      </div>
                      <div className="mt-4">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Enregistrer les modifications</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnerDashboardComplete;
