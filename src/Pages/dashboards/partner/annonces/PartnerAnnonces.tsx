import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Plus, Edit, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import AnnonceForm from '../../../../components/forms/AnnonceForm';

const PartnerAnnonces: React.FC = () => {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<any>(null);

  useEffect(() => {
    loadAnnonces();
  }, []);

  const loadAnnonces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('annonces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnonces(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedAnnonce(null);
    loadAnnonces();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Annonces</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle Annonce
        </button>
      </div>

      {annonces.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">Vous n'avez pas encore d'annonces.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer ma première annonce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((annonce) => (
            <div key={annonce.id} className="bg-white rounded-lg shadow overflow-hidden">
              {annonce.images && annonce.images.length > 0 && (
                <img
                  src={annonce.images[0]}
                  alt={annonce.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{annonce.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {annonce.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">
                    {annonce.price ? `${annonce.price} €` : 'Prix sur demande'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAnnonce(annonce);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedAnnonce ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
            </h2>
            <AnnonceForm
              annonce={selectedAnnonce}
              onClose={() => {
                setShowForm(false);
                setSelectedAnnonce(null);
              }}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerAnnonces;
