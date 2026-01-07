import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { deleteImage } from '../../lib/storage';
import { X, Upload, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImmobilierFormProps {
  immobilier?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ImmobilierForm: React.FC<ImmobilierFormProps> = ({ immobilier, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: immobilier?.title || '',
    description: immobilier?.description || '',
    property_type: immobilier?.property_type || 'Vente',
    price: immobilier?.price || '',
    city: immobilier?.city || '',
    region: immobilier?.region || '',
    address: immobilier?.address || '',
    
    bedrooms: immobilier?.bedrooms || '',
    bathrooms: immobilier?.bathrooms || '',
    floor: immobilier?.floor || '',
    has_elevator: immobilier?.has_elevator ?? false,
    has_parking: immobilier?.has_parking ?? false,
    has_garden: immobilier?.has_garden ?? false,
    contact_phone: immobilier?.contact_phone || '',
    
    available: immobilier?.available ?? true,
    featured: immobilier?.featured ?? false,
  });
  const [images, setImages] = useState<string[]>(immobilier?.images || []);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setUploadingImages(true);
  try {
    // Vérifier que l'utilisateur est connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Utilisateur:', user, 'Erreur:', userError);
    
    if (!user) {
      throw new Error('Veuillez vous connecter pour télécharger des images');
    }

    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `appartements/${fileName}`;

      console.log('Tentative de téléchargement vers:', filePath);
      
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      console.log('Réponse du téléchargement:', { data, uploadError });
      
      if (uploadError) {
        console.error('Détails de l\'erreur:', {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack
        });
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('URL publique:', publicUrl);
      uploadedUrls.push(publicUrl);
    }

    setImages(prev => [...prev, ...uploadedUrls]);
    toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);

  } catch (error: unknown) {
  console.error('Erreur détaillée:', {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : 'No stack trace available'
  });
  
  const errorMessage = error instanceof Error ? error.message : 
                     typeof error === 'string' ? error : 
                     'Erreur lors du téléchargement';
  toast.error(errorMessage);
} finally {
    setUploadingImages(false);
  }
};
  const handleDeleteImage = async (imageUrl: string, index: number) => {
    try {
      await deleteImage(imageUrl);
      setImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Photo supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Validation des champs obligatoires
    if (!formData.title || !formData.city || !formData.address || !formData.description) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }

    // Conversion des valeurs numériques
    const price = parseFloat(formData.price as string);
    if (isNaN(price) || price <= 0) {
      throw new Error('Le prix doit être un nombre positif');
    }

    const dataToSave = {
      ...formData,
      price,
      // Conversion des autres champs numériques avec gestion des valeurs vides
      
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms as string, 10) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms as string, 10) : null,
      floor: formData.floor ? parseInt(formData.floor as string, 10) : null,
      images,
      // Assurez-vous que les booléens ont une valeur par défaut
      available: formData.available ?? true,
      featured: formData.featured ?? false,
      has_elevator: formData.has_elevator ?? false,
      has_parking: formData.has_parking ?? false,
      has_garden: formData.has_garden ?? false
    };

    if (immobilier?.id) {
      const { error } = await supabase
        .from('appartements')
        .update(dataToSave)
        .eq('id', immobilier.id);
      
      if (error) throw error;
      toast.success('Appartement mis à jour avec succès');
    } else {
      const { error } = await supabase
        .from('appartements')
        .insert([dataToSave]);
      
      if (error) throw error;
      toast.success('Appartement créé avec succès');
    }

    onSuccess();
    onClose();
  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[70vh] overflow-y-auto shadow-2xl my-8">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">{immobilier ? 'Modifier le bien' : 'Nouveau bien immobilier'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Photos *</label>
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
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <label className={`flex items-center justify-center px-4 py-3 ${uploadingImages ? 'bg-gray-100' : 'bg-indigo-50 hover:bg-indigo-100'} text-indigo-600 rounded-lg cursor-pointer transition border-2 border-dashed border-indigo-300`}>
              {uploadingImages ? (
                <Loader className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 mr-2" />
              )}
              {uploadingImages ? 'Téléchargement...' : 'Ajouter des photos'}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                disabled={uploadingImages} 
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">Formats acceptés: JPG, PNG, WEBP. Taille max: 5MB</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>Vente</option>
                <option>Location</option>
                <option>Location vacances</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix (MAD) *</label>
              <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
              <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
              <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chambres</label>
              <input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salles de bain</label>
              <input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Étage</label>
              <input type="number" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
            <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.has_elevator} onChange={(e) => setFormData({ ...formData, has_elevator: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Ascenseur</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.has_parking} onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Parking</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.has_garden} onChange={(e) => setFormData({ ...formData, has_garden: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Jardin</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.available} onChange={(e) => setFormData({ ...formData, available: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Disponible</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">À la une</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">Annuler</button>
            <button type="submit" disabled={loading || images.length === 0} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader className="h-5 w-5 animate-spin" />}
              {immobilier ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImmobilierForm;
