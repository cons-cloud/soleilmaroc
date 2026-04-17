import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import ProductForm from '../../components/forms/ProductForm';
import toast from 'react-hot-toast';
import { Package, Home, Building2, Car, Palmtree, Plus } from 'lucide-react';
import type { Service, ServiceType } from '../../types/supabase';

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

type Product = Omit<Service, 'type'> & {
  product_type: ServiceType;
  main_image: string;
  bookings_count: number;
  available: boolean;
  views: number;
  rating: number;
};

const PartnerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFilter, setProductFilter] = useState<string>('all');

  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['partner-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_partner_stats', { partner_id: user.id });
      if (error) throw error;
      return data as PartnerStats;
    },
    enabled: !!user,
  });

  // Products Query
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['partner-products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // REAL-TIME SYNC
  useRealtimeSubscription({
    table: 'products',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-products', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['partner-stats', user?.id] });
    }
  });

  useRealtimeSubscription({
    table: 'bookings',
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-stats', user?.id] });
    }
  });

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'appartement': Home,
      'villa': Building2,
      'hotel': Building2,
      'voiture': Car,
      'circuit': Palmtree
    };
    const Icon = icons[type] || Package;
    return <Icon className="w-5 h-5" />;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success('Produit supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['partner-products', user?.id] });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const loading = statsLoading || productsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {profile?.company_name || 'Partenaire'}
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos produits et suivez vos revenus
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Contenu principal */}
      <div className="space-y-6">
        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Produits</p>
                  <p className="text-2xl font-bold">{stats.total_products}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Réservations</p>
                  <p className="text-2xl font-bold">{stats.total_bookings}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenus ce mois</p>
                  <p className="text-2xl font-bold">{stats.this_month_earnings} DH</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Note moyenne</p>
                  <p className="text-2xl font-bold">{stats.average_rating.toFixed(1)}/5</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des produits */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Mes Produits</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setProductFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  productFilter === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setProductFilter('voiture')}
                className={`px-4 py-2 rounded-lg ${
                  productFilter === 'voiture' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'
                }`}
              >
                Voitures
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {products
              .filter(product => 
                productFilter === 'all' || 
                (productFilter === 'voiture' && product.product_type === 'voiture')
              )
              .map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4">
                    {getProductTypeIcon(product.product_type)}
                    <div>
                      <h3 className="font-medium">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{product.price} DH</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductForm(true);
                        }}
                        className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Formulaire de produit (Modal) */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowProductForm(false);
            queryClient.invalidateQueries({ queryKey: ['partner-products', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['partner-stats', user?.id] });
          }}
        />
      )}
    </div>
  );
};

export default PartnerDashboard;