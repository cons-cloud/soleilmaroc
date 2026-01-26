import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Activity, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ActiviteForm from '../../../components/forms/ActiviteForm';
import ConfirmDialog from '../../../components/modals/ConfirmDialog';

const ActivitesTouristiquesManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedActivite, setSelectedActivite] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activiteToDelete, setActiviteToDelete] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[ActivitesTouristiquesManagement] Chargement de TOUTES les activités du site...');
      
      // Charger TOUTES les activités du site (pas de filtre par partner_id)
      // Essayer d'abord avec RPC ou avec service_role si disponible
      let { data, error } = await supabase
        .from('activites_touristiques')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Si erreur 403/RLS, essayer avec une approche différente
      const errStatus = (error as any)?.status as number | undefined;
      if (error && (error.code === '42501' || error.code === 'PGRST301' || error.code === 'PGRST302' || errStatus === 403)) {
        console.warn('[ActivitesTouristiquesManagement] Erreur RLS détectée, tentative alternative...');
        
        // Essayer de charger seulement les champs de base
        const retry = await supabase
          .from('activites_touristiques')
          .select('id, title, city, activity_type, price_per_person, available, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (!retry.error) {
          console.log('[ActivitesTouristiquesManagement] Chargement partiel réussi');
          data = retry.data;
          error = null;
        } else {
          // Si ça échoue aussi, afficher un message d'erreur clair
          const message = 'Accès refusé: les politiques de sécurité RLS bloquent l\'accès. Veuillez exécuter le script SQL "fix-rls-final-no-errors.sql" dans Supabase SQL Editor pour corriger les permissions admin.';
          setError(message);
          toast.error('Permissions insuffisantes. Consultez la console pour plus de détails.');
          console.error('[ActivitesTouristiquesManagement] Erreur de permission RLS:', error);
          setItems([]);
          return;
        }
      }
      
      if (error) {
        console.error('[ActivitesTouristiquesManagement] Erreur Supabase:', error);
        
        // Gérer l'erreur 404 (table non trouvée)
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('not found') || error.code === '42P01') {
          const message = 'La table "activites_touristiques" n\'existe pas. Veuillez exécuter "create-activites-table.sql" dans Supabase SQL Editor.';
          setError(message);
          toast.error('Table non trouvée. Veuillez créer la table dans Supabase.');
          setItems([]);
          return;
        }
        
        // Autres erreurs
        throw error;
      }
      
      console.log(`[ActivitesTouristiquesManagement] ${data?.length || 0} activités chargées`);
      setItems(data || []);
    } catch (error: any) {
      console.error('[ActivitesTouristiquesManagement] Erreur:', error);
      const errorMessage = error?.message || 'Erreur lors du chargement des activités';
      
      // Toujours définir l'erreur pour l'affichage dans l'UI
      if (errorMessage.includes('n\'existe pas') || errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        setError(errorMessage);
        toast.error('Table non trouvée. Veuillez exécuter le script SQL de création.');
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedActivite(null);
    setShowForm(true);
  };

  const handleEdit = (activite: any) => {
    setSelectedActivite(activite);
    setShowForm(true);
  };

  const handleDeleteClick = (activite: any) => {
    setActiviteToDelete(activite);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activiteToDelete) return;
    try {
      const { error } = await supabase.from('activites_touristiques').delete().eq('id', activiteToDelete.id);
      if (error) throw error;
      toast.success('Activité supprimée');
      setShowConfirm(false);
      setActiviteToDelete(null);
      loadItems();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="ml-4 text-gray-600">Chargement des activités...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadItems}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Activités Touristiques</h1>
          <p className="text-gray-600 mt-1">
            {filteredItems.length} activité{filteredItems.length > 1 ? 's' : ''} 
            {items.length !== filteredItems.length && ` (${items.length} au total sur le site)`}
          </p>
        </div>
        <button onClick={handleNew} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Activité
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
            <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-200">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Activity className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {item.featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">⭐</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{item.activity_type}</p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {item.city}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <span>⏱️ {item.duration_hours}h</span>
                  <span>👥 Max {item.max_participants}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-lg font-bold text-emerald-600">{item.price_per_person} MAD</span>
                    <span className="text-sm text-gray-500">/pers</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition" title="Modifier">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(item)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-12 text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activité trouvée</h3>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ActiviteForm
          activite={selectedActivite}
          onClose={() => {
            setShowForm(false);
            setSelectedActivite(null);
          }}
          onSuccess={() => {
            loadItems();
            setShowForm(false);
          }}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setActiviteToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Supprimer l'activité"
          message={`Êtes-vous sûr de vouloir supprimer "${activiteToDelete?.title}" ?`}
          type="danger"
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      )}
    </div>
  );
};

// Exportation nommée pour la compatibilité avec React.lazy
export { ActivitesTouristiquesManagement as default };
