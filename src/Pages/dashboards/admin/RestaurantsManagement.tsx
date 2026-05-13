import React, { useState } from 'react';
import useServices from '../../../hooks/useServices';
import { Plus, Search, MapPin, Utensils, Star, Edit, Trash2, ExternalLink } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

const RestaurantsManagement: React.FC = () => {
  const { services: restaurants, loading, refresh } = useServices('restaurants_marocsoleil');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ?')) return;
    
    try {
      const { error } = await supabase
        .from('restaurants_marocsoleil')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Restaurant supprimé avec succès');
      refresh();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression: ' + error.message);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingState />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Gestion des Restaurants</h1>
          <p className="text-gray-500">Gérez les établissements gastronomiques et leurs menus.</p>
        </div>
        <Link 
          to="/dashboard/partner/products/new" 
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Ajouter un Restaurant
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant, une ville, une cuisine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cuisine</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ville</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100">
                        <img 
                          src={restaurant.images?.[0] || 'https://via.placeholder.com/150'} 
                          alt={restaurant.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{restaurant.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{restaurant.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                      {restaurant.cuisine_type || 'Non défini'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {restaurant.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      {restaurant.rating?.toFixed(1) || '0.0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/services/restaurants/${restaurant.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Voir sur le site"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                      <Link 
                        to={`/dashboard/partner/products/${restaurant.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(restaurant.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRestaurants.length === 0 && (
            <div className="p-12 text-center">
              <Utensils className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">Aucun restaurant trouvé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantsManagement;
