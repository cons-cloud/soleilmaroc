import React, { useEffect, useState } from 'react';

import DashboardLayout from '../../components/layouts/DashboardLayout'

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ProductForm from './partner/ProductForm';
import toast from 'react-hot-toast';

const PartnerDashboardComplete: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'bookings'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[PartnerDashboard] load products error', error);
        toast.error('Erreur lors du chargement des produits');
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('[PartnerDashboard] unexpected error', err);
      toast.error('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleProductCreated = () => {
    loadDashboardData();
    setShowProductForm(false);
    toast.success('Produit créé / mis à jour');
  };

  const handleProductClose = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const { error } = await supabase.from('partner_products').delete().eq('id', productId).eq('partner_id', user.id);
      if (error) throw error;
      toast.success('Produit supprimé');
      loadDashboardData();
    } catch (err: any) {
      console.error('[PartnerDashboard] delete error', err);
      toast.error(err?.message || 'Impossible de supprimer le produit');
    }
  };

  return (
    <DashboardLayout role="partner">
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Mes services</h2>
              <div>
                <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Ajouter un produit</button>
              </div>
            </div>

            <div className="mb-4">
              <button className={`px-3 py-2 mr-2 rounded ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('products')}>Produits</button>
              <button className={`px-3 py-2 rounded ${activeTab === 'bookings' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('bookings')}>Réservations</button>
            </div>

            {activeTab === 'products' && (
              <div className="space-y-4">
                {loading ? (
                  <div>Chargement...</div>
                ) : products.length === 0 ? (
                  <div className="p-6 text-gray-600">Aucun produit trouvé.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Titre</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Prix</th>
                          <th className="px-4 py-2 text-left">Disponible</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {products.map((p: any) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">{p.title}</td>
                            <td className="px-4 py-3">{p.product_type || '-'}</td>
                            <td className="px-4 py-3">{p.price != null ? p.price : '-'}</td>
                            <td className="px-4 py-3">{p.available ? 'Oui' : 'Non'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(p)} className="px-3 py-1 bg-yellow-400 rounded">Éditer</button>
                                <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-500 text-white rounded">Supprimer</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {showProductForm && (
                  <ProductForm
                    onClose={handleProductClose}
                    onCreate={handleProductCreated}
                    editingProduct={editingProduct}
                  />
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                {/* Placeholder: bookings list component can be inserted here */}
                <p className="text-gray-600">Liste des réservations (à implémenter)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnerDashboardComplete;
