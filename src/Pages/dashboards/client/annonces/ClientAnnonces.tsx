import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ClientAnnonces: React.FC = () => {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    loadAnnonces();
    loadFavorites();
  }, [filters]);

  const loadAnnonces = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('annonces')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', Number(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price', Number(filters.maxPrice));
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnnonces(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('annonce_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const favoriteIds = new Set(data?.map((fav: any) => fav.annonce_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const toggleFavorite = async (annonceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Veuillez vous connecter pour ajouter aux favoris');
        return;
      }

      const isFavorite = favorites.has(annonceId);
      
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('annonce_id', annonceId);
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(annonceId);
          return newFavorites;
        });
        
        toast.success('Annonce retirée des favoris');
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, annonce_id: annonceId }]);
        
        setFavorites(prev => new Set(prev).add(annonceId));
        toast.success('Annonce ajoutée aux favoris');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set(annonces.map(annonce => annonce.category).filter(Boolean));
    return Array.from(categories);
  };

  const getUniqueCities = () => {
    const cities = new Set(annonces.map(annonce => annonce.city).filter(Boolean));
    return Array.from(cities);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Annonces</h1>
      
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Filtrer les annonces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Toutes les catégories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Toutes les villes</option>
              {getUniqueCities().map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix min</label>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix max</label>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Liste des annonces */}
      {annonces.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune annonce trouvée</h3>
          <p className="text-gray-500">Aucune annonce ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((annonce) => (
            <div key={annonce.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
              <div className="relative">
                {annonce.images && annonce.images.length > 0 ? (
                  <img
                    src={annonce.images[0]}
                    alt={annonce.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Aucune image</span>
                  </div>
                )}
                <button
                  onClick={() => toggleFavorite(annonce.id)}
                  className={`absolute top-2 right-2 p-2 rounded-full ${
                    favorites.has(annonce.id) ? 'text-red-500' : 'text-white bg-black bg-opacity-50'
                  }`}
                >
                  <Heart 
                    className={`w-5 h-5 ${favorites.has(annonce.id) ? 'fill-current' : ''}`} 
                  />
                </button>
                {annonce.featured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Mise en avant
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{annonce.title}</h3>
                  <span className="font-bold text-blue-600">
                    {annonce.price ? `${annonce.price} €` : 'Sur demande'}
                  </span>
                </div>
                
                {annonce.city && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {annonce.city}
                  </div>
                )}
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                  {annonce.description}
                </p>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(annonce.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link
                    to={`/annonces/${annonce.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientAnnonces;
