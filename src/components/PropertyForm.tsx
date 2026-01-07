import React, { useState, useEffect } from 'react';
import { X, Loader, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type PropertyType = 'hotel' | 'apartment' | 'villa' | 'car' | 'tour';

interface BaseProperty {
  id?: string;
  name: string;
  description: string;
  city: string;
  region: string;
  address: string;
  contact_phone: string;
  available: boolean;
  featured: boolean;
  images: string[];
  price_per_night?: number;
  price_per_day?: number;
  price_per_person?: number;
  [key: string]: any;
}

interface PropertyFormProps {
  property?: BaseProperty | null;
  type: PropertyType;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultFormData = (type: PropertyType): BaseProperty => ({
  name: '',
  description: '',
  city: '',
  region: '',
  address: '',
  contact_phone: '',
  available: true,
  featured: false,
  images: [],
  ...(type === 'hotel' && {
    stars: 3,
    amenities: [],
    price_per_night: 0,
    rooms_count: 1
  }),
  ...(type === 'apartment' && {
    price_per_night: 0,
    bedrooms: 1,
    bathrooms: 1,
    size: 0,
    floor: 0,
    has_balcony: false,
    has_parking: false,
    is_furnished: false,
    amenities: []
  }),
  ...(type === 'villa' && {
    price_per_night: 0,
    bedrooms: 1,
    bathrooms: 1,
    size: 0,
    has_pool: false,
    has_garden: false,
    has_garage: false,
    floors: 1,
    amenities: []
  }),
  ...(type === 'car' && {
    price_per_day: 0,
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    seats: 5,
    transmission: 'automatic',
    fuel_type: 'essence',
    mileage: 0,
    insurance_included: true
  }),
  ...(type === 'tour' && {
    price_per_person: 0,
    duration_days: 1,
    difficulty: 'moderate',
    max_participants: 10,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    included: [],
    not_included: [],
    meeting_point: ''
  })
});

const PropertyForm: React.FC<PropertyFormProps> = ({ property, type, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<BaseProperty>(defaultFormData(type));
  const [images, setImages] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setFormData(property);
      setImages(property.images || []);
    } else {
      setFormData(defaultFormData(type));
      setImages([]);
    }
  }, [property, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!files) return [];
    const uploadedUrls: string[] = [];
    setUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
    } catch (error) {
      console.error('Erreur lors du téléchargement des images:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !formData.amenities?.includes(newAmenity.trim())) {
      const updatedAmenities = [...(formData.amenities || []), newAmenity.trim()];
      setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    const updatedAmenities = (formData.amenities || []).filter((a: string) => a !== amenity);
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Vérifier si des fichiers ont été sélectionnés
      if (files && files.length === 0 && !property?.id) {
        setError('Veuillez sélectionner au moins une image');
        return;
      }

      // Télécharger les images si de nouvelles ont été ajoutées
      let imageUrls = [...images];
      if (files && files.length > 0) {
        imageUrls = [...imageUrls, ...(await uploadImages())];
      }

      const dataToSave = {
        ...formData,
        images: imageUrls,
        type,
        updated_at: new Date().toISOString()
      };

      if (property?.id) {
        const { error } = await supabase
          .from('properties')
          .update(dataToSave)
          .eq('id', property.id);

        if (error) throw error;
        toast.success('Propriété mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([{ 
            ...dataToSave, 
            created_at: new Date().toISOString() 
          }])
          .select();

        if (error) throw error;
        toast.success('Propriété créée avec succès');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError(error.message || 'Une erreur est survenue');
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificFields = () => {
    switch (type) {
      case 'hotel':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="stars" className="block text-sm font-medium text-gray-700">
                Nombre d'étoiles
              </label>
              <select
                id="stars"
                name="stars"
                value={formData.stars || 3}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>
                    {num} {num > 1 ? 'étoiles' : 'étoile'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">
                Prix par nuit (MAD)
              </label>
              <input
                type="number"
                id="price_per_night"
                name="price_per_night"
                value={formData.price_per_night || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="form-group">
              <label htmlFor="rooms_count" className="block text-sm font-medium text-gray-700">
                Nombre de chambres
              </label>
              <input
                type="number"
                id="rooms_count"
                name="rooms_count"
                value={formData.rooms_count || ''}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équipements
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                  placeholder="Ajouter un équipement"
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.amenities && formData.amenities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.amenities.map((amenity: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      // Ajoutez ici les autres cas pour les autres types de propriétés
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">
          {property ? 'Modifier' : 'Ajouter'} {type}
        </h2>
        
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              Ville
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="form-group">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Région
            </label>
            <input
              type="text"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Adresse complète
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
            Téléphone de contact
          </label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {renderSpecificFields()}

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Uploader des fichiers</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                <p className="pl-1">ou glisser-déposer</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF jusqu'à 10MB
              </p>
            </div>
          </div>
          
          {uploading && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" />
              Téléchargement en cours...
            </div>
          )}
          
          {images.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="h-32 w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...images];
                        newImages.splice(index, 1);
                        setImages(newImages);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer l'image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              name="available"
              checked={formData.available}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
              Disponible à la réservation
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Mettre en avant
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || uploading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              {uploading ? 'Téléchargement...' : 'Enregistrement...'}
            </>
          ) : property ? (
            'Mettre à jour'
          ) : (
            'Ajouter'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
    </form>
  );
};

export default PropertyForm;