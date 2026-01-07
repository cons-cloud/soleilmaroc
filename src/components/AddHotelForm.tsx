// src/components/AddHotelForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateHotel } from '../hooks/useCreateHotel';
import { supabase } from '../lib/supabase';


export const AddHotelForm = () => {
  const { createHotel, loading, error } = useCreateHotel();
  const navigate = useNavigate();
  // Mettez à jour l'interface du state pour correspondre à la structure de la table
const [formData, setFormData] = useState({
  name: '',
  name_ar: '',  // Ajout du champ manquant
  description: '',
  price_per_night: 0,  // Changé de string à number
  city: '',
  region: '',
  address: '',
  stars: 3,  // Changé de string à number
  amenities: [] as string[],
  contact_phone: '',
  
  available: true,
  featured: false,
  images: [] as string[],
  rooms_count: 1  // Ajout du champ manquant avec une valeur par défaut
});

// Mettez à jour la fonction handleChange pour gérer correctement les types
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  const checked = (e.target as HTMLInputElement).checked;
  
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : 
            (type === 'number' || name === 'stars' || name === 'price_per_night' || name === 'rooms_count') ? 
            Number(value) : value
  }));
};

// Mettez à jour la fonction handleSubmit pour formater correctement les données
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Assurez-vous que les types sont corrects
    const hotelData = {
      ...formData,
      stars: Number(formData.stars),
      price_per_night: Number(formData.price_per_night),
      rooms_count: formData.rooms_count || 1
    };
    
    const newHotel = await createHotel(hotelData);
    console.log('Hôtel créé avec succès:', newHotel);
    navigate('/hotels');
  } catch (err) {
    console.error('Erreur:', err);
  }
};

// Fonction pour gérer les changements des cases à cocher des équipements
const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { value, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    amenities: checked
      ? [...prev.amenities, value]
      : prev.amenities.filter(a => a !== value)
  }));
};

// Fonction pour gérer le téléchargement des images
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  try {
    const files = Array.from(e.target.files);
    const uploadedImageUrls: string[] = [];

    // Limiter le nombre de fichiers à 5
    if (files.length > 5) {
      alert('Vous ne pouvez télécharger que 5 images maximum');
      return;
    }

    // Vérifier la taille des fichiers
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert(`Le fichier ${file.name} dépasse la taille maximale de 5MB`);
        return;
      }
    }

    // Télécharger chaque fichier
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `hotels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hotel-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('hotel-images')
        .getPublicUrl(filePath);

      uploadedImageUrls.push(publicUrl);
    }

    // Mettre à jour l'état avec les nouvelles URLs
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedImageUrls]
    }));

  } catch (error) {
    console.error('Erreur lors du téléchargement des images:', error);
    alert('Une erreur est survenue lors du téléchargement des images');
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom de l'hôtel</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix par nuit (MAD)</label>
          <input
            type="number"
            name="price_per_night"
            value={formData.price_per_night}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Étoiles</label>
          <select
            name="stars"
            value={formData.stars}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'étoile' : 'étoiles'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ville</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Région</label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Équipements</label>
        <div className="mt-2 space-y-2">
          {['WiFi', 'Piscine', 'Parking', 'Restaurant', 'Spa', 'Climatisation'].map(amenity => (
            <div key={amenity} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity}`}
                value={amenity}
                checked={formData.amenities.includes(amenity)}
                onChange={handleAmenityChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

      
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            name="available"
            checked={formData.available}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="available" className="ml-2 text-sm text-gray-700">
            Disponible
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            name="featured"
            checked={formData.featured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
            En vedette
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Téléchargez des images de l'hôtel (maximum 10 Mo par image)
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Création en cours...' : 'Créer l\'hôtel'}
        </button>
      </div>
    </form>
  );
};

// Page wrapper pour le formulaire
export const AddHotelPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-semibold text-gray-900">Ajouter un nouvel hôtel</h1>
        <p className="mt-2 text-sm text-gray-600">
          Remplissez les informations ci-dessous pour ajouter un nouvel hôtel à votre catalogue.
        </p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <AddHotelForm />
      </div>
    </div>
  );
};

export default AddHotelPage;