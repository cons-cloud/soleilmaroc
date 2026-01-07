import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadMultipleImages, deleteImage } from '../../lib/storage';
import { X, Upload, Trash2, Loader, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CircuitFormData {
  title: string;
  description: string;
  duration_days: number;
  price: number;
  price_per_person: boolean;
  destinations: string[];
  included_services: string[];
  max_participants: number | null;
  difficulty_level: string;
  available: boolean;
  featured: boolean;
}

interface CircuitFormProps {
  circuit?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CircuitForm: React.FC<CircuitFormProps> = ({ circuit, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<CircuitFormData>({
    title: circuit?.title || '',
    description: circuit?.description || '',
    duration_days: circuit?.duration_days || 1,
    price: circuit?.price || 0,
    price_per_person: circuit?.price_per_person ?? true,
    destinations: circuit?.destinations || [],
    included_services: circuit?.included_services || [],
    max_participants: circuit?.max_participants || 10,
    difficulty_level: circuit?.difficulty_level || 'Facile',
    available: circuit?.available ?? true,
    featured: circuit?.featured ?? false,
  });
  const [images, setImages] = useState<string[]>(circuit?.images || []);
  const [newDestination, setNewDestination] = useState('');
  const [newService, setNewService] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadMultipleImages(Array.from(files), 'circuits');
      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);
    } catch (error) {
      console.error('Erreur lors du téléchargement des images:', error);
      toast.error('Erreur lors du téléchargement des images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    try {
      await deleteImage(imageUrl);
      setImages(prev => {
        const newImages = [...prev];
        newImages.splice(index, 1);
        return newImages;
      });
      toast.success('Photo supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      toast.error('Erreur lors de la suppression de l\'image');
    }
  };

  const addDestination = () => {
    if (newDestination.trim() && !formData.destinations.includes(newDestination.trim())) {
      setFormData(prev => ({
        ...prev,
        destinations: [...prev.destinations, newDestination.trim()]
      }));
      setNewDestination('');
    }
  };

  const removeDestination = (index: number) => {
    setFormData(prev => {
      const newDestinations = [...prev.destinations];
      newDestinations.splice(index, 1);
      return {
        ...prev,
        destinations: newDestinations
      };
    });
  };

  const addService = () => {
    if (newService.trim() && !formData.included_services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        included_services: [...prev.included_services, newService.trim()]
      }));
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => {
      const newServices = [...prev.included_services];
      newServices.splice(index, 1);
      return {
        ...prev,
        included_services: newServices
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const dataToSave = {
      ...formData,
      images,
      duration_days: Number(formData.duration_days) || 1,
      price: Number(formData.price) || 0,
      max_participants: formData.max_participants ? Number(formData.max_participants) : null,
      price_per_person: Boolean(formData.price_per_person),
      available: Boolean(formData.available),
      featured: Boolean(formData.featured),
      destinations: Array.isArray(formData.destinations) ? formData.destinations : [],
      included_services: Array.isArray(formData.included_services) ? formData.included_services : [],
    };

    console.log('Données à enregistrer:', JSON.stringify(dataToSave, null, 2));

    let error;
    if (circuit?.id) {
      ({ error } = await supabase
        .from('circuits_touristiques')
        .update(dataToSave)
        .eq('id', circuit.id)
        .select());
    } else {
      ({ error } = await supabase
        .from('circuits_touristiques')
        .insert([dataToSave])
        .select());
    }

    if (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    toast.success(circuit?.id ? 'Circuit mis à jour avec succès' : 'Circuit créé avec succès');
    onSuccess();
  } catch (error: any) {
    console.error('Erreur complète:', error);
    toast.error(error.message || 'Une erreur est survenue lors de la sauvegarde');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">{circuit ? 'Modifier le circuit' : 'Nouveau circuit'}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-full transition"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Photos du circuit {images.length === 0 && '*'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-lg" 
                  />
                  <button 
                    type="button" 
                    onClick={() => handleDeleteImage(img, index)} 
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <label className={`flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer transition border-2 border-dashed ${
              uploadingImages 
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-wait' 
                : 'bg-teal-50 border-teal-300 text-teal-600 hover:bg-teal-100'
            }`}>
              <Upload className="h-5 w-5 mr-2" />
              {uploadingImages ? 'Téléchargement...' : 'Ajouter des photos'}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                disabled={uploadingImages || loading} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
              <input 
                type="text" 
                required 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix (MAD) *</label>
              <input 
                type="number" 
                required 
                min="0" 
                step="0.01"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée (jours) *</label>
              <input 
                type="number" 
                required 
                min="1" 
                value={formData.duration_days} 
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 1})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Participants max</label>
              <input 
                type="number" 
                min="1" 
                value={formData.max_participants || ''} 
                onChange={(e) => setFormData({
                  ...formData, 
                  max_participants: e.target.value ? parseInt(e.target.value) : null
                })} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté *</label>
              <select 
                value={formData.difficulty_level} 
                onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="Facile">Facile</option>
                <option value="Moyen">Moyen</option>
                <option value="Difficile">Difficile</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.price_per_person} 
                  onChange={(e) => setFormData({...formData, price_per_person: e.target.checked})} 
                  className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500" 
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Prix par personne</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea 
              required 
              rows={4} 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinations</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                value={newDestination} 
                onChange={(e) => setNewDestination(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())} 
                placeholder="Ex: Marrakech, Fès..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={addDestination} 
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
                disabled={loading || !newDestination.trim()}
              >
                <Plus className="h-5 w-5" /> Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.destinations.map((dest, index) => (
                <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-2">
                  {dest}
                  <button 
                    type="button" 
                    onClick={() => removeDestination(index)} 
                    className="hover:text-red-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services inclus</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                value={newService} 
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())} 
                placeholder="Ex: Hébergement, Transport..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={addService} 
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
                disabled={loading || !newService.trim()}
              >
                <Plus className="h-5 w-5" /> Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.included_services.map((service, index) => (
                <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-2">
                  {service}
                  <button 
                    type="button" 
                    onClick={() => removeService(index)} 
                    className="hover:text-red-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.available} 
                onChange={(e) => setFormData({...formData, available: e.target.checked})} 
                className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500" 
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Disponible</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.featured} 
                onChange={(e) => setFormData({...formData, featured: e.target.checked})} 
                className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500" 
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">À la une</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50" 
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || images.length === 0} 
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="h-5 w-5 animate-spin" /> : null}
              {circuit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CircuitForm;