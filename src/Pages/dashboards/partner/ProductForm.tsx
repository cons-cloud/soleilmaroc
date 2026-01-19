import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  ArrowLeft, Save, X, Plus, Trash2, 
  Check, MapPin, DollarSign
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import type { Product } from '../../../types';

type ProductType = 'appartement' | 'villa' | 'hotel' | 'voiture' | 'circuit';
type PriceType = 'per_night' | 'per_day' | 'per_person';

interface Feature {
  id: string;
  name: string;
  value: string;
}

interface ProductFormData {
  title: string;
  description: string;
  product_type: ProductType;
  price: number;
  price_type: PriceType;
  city: string;
  address: string;
  location_lat: number | null;
  location_lng: number | null;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  available: boolean;
  features: Feature[];
  amenities: string[];
  images: File[];
  existingImages: string[];
  deletedImages: (string | undefined)[];
}

const createEmptyFeature = (): Feature => ({ id: uuidv4(), name: '', value: '' });

const parseFeatures = (input: any): Feature[] => {
  if (!input) return [createEmptyFeature()];
  if (Array.isArray(input)) {
    return input.map((f: any) => ({
      id: uuidv4(),
      name: String(f?.name ?? ''),
      value: String(f?.value ?? '')
    }));
  }
  if (typeof input === 'object') {
    return Object.entries(input).map(([name, value]) => ({
      id: uuidv4(),
      name,
      value: String(value ?? '')
    }));
  }
  return [createEmptyFeature()];
};

const amenitiesList = [
  'wifi', 'piscine', 'parking', 'climatisation', 'chauffage',
  'cuisine_equipee', 'tv', 'lave_linge', 'seche_linge', 'terrasse',
  'jardin', 'vue_mer', 'vue_montagne', 'acces_plage', 'piscine_chauffee'
];

interface ProductFormProps {
  onClose: () => void;
  onCreate?: () => void;
  editingProduct?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose, onCreate, editingProduct }) => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRouteEditing = !!id;
  const isEditing = isRouteEditing || !!editingProduct?.id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    product_type: 'appartement',
    price: 0,
    price_type: 'per_night',
    city: '',
    address: '',
    location_lat: null,
    location_lng: null,
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    surface: 0,
    available: true,
    features: [createEmptyFeature()],
    amenities: [],
    images: [],
    existingImages: [],
    deletedImages: []
  } as ProductFormData);

  // Charger le produit existant en mode édition (route)
  useEffect(() => {
    if (!isRouteEditing) return;
 
    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('partner_products')
          .select('*')
          .eq('id', id)
          .eq('partner_id', user?.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Produit non trouvé');

        setFormData({
          ...data,
          features: parseFeatures(data.features),
          amenities: data.amenities || [],
          existingImages: data.images || [],
          images: [],
          deletedImages: []
        });

        setPreviewUrls(data.images || []);
      } catch (error) {
        console.error('Erreur lors du chargement du produit:', error);
        toast.error('Erreur lors du chargement du produit');
        navigate('/dashboard/partner/products');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isRouteEditing, user?.id, navigate]);
 
  // Si editingProduct est passé depuis le parent (modal), initialiser le formulaire depuis cette prop
  useEffect(() => {
    if (!editingProduct) return;
    if (isRouteEditing) return;

    setFormData({
      title: editingProduct.title ?? '',
      description: (editingProduct as any).description ?? '',
      product_type: (editingProduct.product_type as ProductType) ?? 'appartement',
      price: Number(editingProduct.price ?? 0),
      price_type: (editingProduct as any).price_type ?? 'per_night',
      city: editingProduct.city ?? '',
      address: (editingProduct as any).address ?? '',
      location_lat: (editingProduct as any).location_lat ?? null,
      location_lng: (editingProduct as any).location_lng ?? null,
      max_guests: Number((editingProduct as any).max_guests ?? 1),
      bedrooms: Number((editingProduct as any).bedrooms ?? 1),
      bathrooms: Number((editingProduct as any).bathrooms ?? 1),
      surface: Number((editingProduct as any).surface ?? 0),
      available: editingProduct.available ?? true,
      features: parseFeatures((editingProduct as any).features),
      amenities: (editingProduct as any).amenities ?? [],
      images: [],
      existingImages: (editingProduct as any).images ?? [],
      deletedImages: []
    } as ProductFormData);

    setPreviewUrls((editingProduct as any).images ?? []);
  }, [editingProduct, isRouteEditing]);

  // Gérer les changements des champs de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 :
              type === 'checkbox' ? target.checked :
              value
    }));
  };

  // Gérer les changements des caractéristiques
  const handleFeatureChange = (id: string, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(feature => 
        feature.id === id ? { ...feature, [field]: value } : feature
      )
    }));
  };

  // Ajouter une nouvelle caractéristique
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, createEmptyFeature()]
    }));
  };

  // Supprimer une caractéristique
  const removeFeature = (id: string) => {
    setFormData(prev => {
      const newFeatures = prev.features.filter(f => f.id !== id);
      return { ...prev, features: newFeatures.length ? newFeatures : [createEmptyFeature()] };
    });
  };

  // Gérer la sélection des équipements
  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Gérer la sélection des images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
    
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // Supprimer une image
  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      const imageUrl = formData.existingImages[index];
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          existingImages: prev.existingImages.filter((_, i) => i !== index),
          deletedImages: [...(prev.deletedImages || []), imageUrl]
        }));
        
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      // index is index in previewUrls; non-existing images start after existingImages.length
      const existingCount = formData.existingImages?.length || 0;
      const fileIndex = index - existingCount;
      if (fileIndex < 0) return; // safety
      const newImages = [...formData.images];
      newImages.splice(fileIndex, 1);
      
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
      
      setPreviewUrls(prev => {
        const newUrls = [...prev];
        const urlToRemove = newUrls[index];
        if (urlToRemove && urlToRemove.startsWith('blob:')) {
          URL.revokeObjectURL(urlToRemove);
        }
        newUrls.splice(index, 1);
        return newUrls;
      });
    }
  };

  // Téléverser les images sur Supabase Storage
  const uploadImages = async (productId: string): Promise<string[]> => {
    if (formData.images.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of formData.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${uuidv4()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data } = await supabase.storage
          .from('services')
          .getPublicUrl(filePath);
        
        const publicUrl = (data && (data as any).publicUrl) || (data as any)?.publicUrl;
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Erreur lors du téléversement des images:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Supprimer les images marquées pour suppression
  const deleteMarkedImages = async (urls: (string | undefined)[]) => {
    if (!urls.length) return;
    
    try {
      for (const url of urls) {
        if (!url) continue;
        
        // Tentative robuste d'extraction du path stocké en storage:
        // public URL pattern includes '/storage/v1/object/public/services/<path>'
        const marker = '/storage/v1/object/public/services/';
        let path = '';
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          path = url.substring(idx + marker.length);
        } else {
          // fallback: try after '/services/'
          const marker2 = '/services/';
          const idx2 = url.indexOf(marker2);
          if (idx2 !== -1) {
            path = url.substring(idx2 + marker2.length);
          } else {
            // last resort: take last 3 segments to reconstruct 'products/<id>/<file>'
            const parts = url.split('/').filter(Boolean);
            path = parts.slice(-3).join('/');
          }
        }

        if (path) {
          const { error } = await supabase.storage
            .from('services')
            .remove([path]);
            
          if (error) console.error(`Erreur lors de la suppression de l'image ${path}:`, error);
        } else {
          console.warn('Impossible d\'extraire le chemin de suppression pour', url);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des images:', error);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour effectuer cette action');
      return;
    }
    
    try {
      setLoading(true);
      
      const featuresObj = formData.features
        .filter(f => f.name && f.value)
        .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
      
      const productData: any = {
        title: formData.title || null,
        description: formData.description || null,
        product_type: formData.product_type,
        price: Number(formData.price) || 0,
        price_type: formData.price_type || 'per_night',
        city: formData.city || null,
        address: formData.address || null,
        available: Boolean(formData.available),
        partner_id: user.id,
      };
      
      if (formData.max_guests) {
        productData.max_guests = Number(formData.max_guests);
        (featuresObj as any).max_guests = String(formData.max_guests);
      }
      
      if (formData.bedrooms) (featuresObj as any).bedrooms = String(formData.bedrooms);
      if (formData.bathrooms) (featuresObj as any).bathrooms = String(formData.bathrooms);
      if (formData.surface) (featuresObj as any).surface = String(formData.surface);
      
      productData.features = Object.keys(featuresObj).length > 0 ? featuresObj : null;
      productData.amenities = Array.isArray(formData.amenities) && formData.amenities.length > 0 ? formData.amenities : null;
      
      if (formData.location_lat !== null && formData.location_lat !== undefined) {
        productData.location_lat = Number(formData.location_lat);
      }
      if (formData.location_lng !== null && formData.location_lng !== undefined) {
        productData.location_lng = Number(formData.location_lng);
      }
      
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });
      
      let productId = id || editingProduct?.id;
      
      if (isEditing) {
        if (!productId) throw new Error('Aucun ID de produit pour la mise à jour');
        // Mise à jour d'un produit existant
        const { error: updateError } = await supabase
          .from('partner_products')
          .update(productData)
          .eq('id', productId)
          .eq('partner_id', user.id);
          
        if (updateError) throw updateError;
        
        if (formData.deletedImages && formData.deletedImages.length > 0) {
          const validUrls = formData.deletedImages.filter((url): url is string => !!url);
          if (validUrls.length > 0) {
            await deleteMarkedImages(validUrls);
          }
        }
      } else {
        // Créer un nouveau produit
        const { data, error: insertError } = await supabase
          .from('partner_products')
          .insert([productData])
          .select()
          .single();
          
        if (insertError) {
          console.error('[ProductForm] Erreur d\'insertion:', insertError);
          throw insertError;
        }
        
        if (!data || !data.id) {
          throw new Error('Le produit a été créé mais aucun ID n\'a été retourné');
        }
        
        productId = data.id;
      }
      
      const productIdStr = String(productId || '');
      
      // Téléverser les nouvelles images
      const uploadedImageUrls = await uploadImages(productIdStr);
      
      // Mettre à jour le produit avec les URLs des images
      const allImageUrls = [...(formData.existingImages || []), ...uploadedImageUrls].filter((url): url is string => !!url);
      
      const { error: updateImagesError } = await supabase
        .from('partner_products')
        .update({
          images: allImageUrls,
          main_image: allImageUrls[0] || null
        })
        .eq('id', productIdStr);
        
      if (updateImagesError) throw updateImagesError;
      
      toast.success(`Produit ${isEditing ? 'mis à jour' : 'créé'} avec succès`);
      if (onCreate) onCreate();
      navigate('/dashboard/partner/products');
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error(`Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} du produit`);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du formulaire
  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
          </h1>
          <p className="mt-1 text-gray-600">
            Remplissez les détails de votre {formData.product_type} pour le publier sur Maroc 2030
          </p>
        </div>
        <div>
          <Link
            to="/dashboard/partner/products"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-8 divide-y divide-gray-200">
          {/* Section Informations de base */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Informations de base
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Les informations principales de votre annonce.
              </p>
            </div>
            <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titre de l'annonce *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product_type" className="block text-sm font-medium text-gray-700">
                  Type de produit *
                </label>
                <div className="mt-1">
                  <select
                    id="product_type"
                    name="product_type"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.product_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="appartement">🏠 Appartement</option>
                    <option value="villa">🏡 Villa</option>
                    <option value="hotel">🏨 Hôtel</option>
                    <option value="voiture">🚗 Voiture</option>
                    <option value="circuit">🗺️ Circuit touristique</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description détaillée *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Décrivez votre bien ou service de manière détaillée.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Prix *
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="price_type" className="block text-sm font-medium text-gray-700">
                  Type de prix *
                </label>
                <div className="mt-1">
                  <select
                    id="price_type"
                    name="price_type"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.price_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="per_night">Par nuit</option>
                    <option value="per_day">Par jour</option>
                    <option value="per_person">Par personne</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ville *
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse complète
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="address"
                    id="address"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="max_guests" className="block text-sm font-medium text-gray-700">
                  Nombre maximum de voyageurs *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="max_guests"
                    id="max_guests"
                    min="1"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.max_guests}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                  Nombre de chambres
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="bedrooms"
                    id="bedrooms"
                    min="0"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.bedrooms}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                  Nombre de salles de bain
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="bathrooms"
                    id="bathrooms"
                    min="0"
                    step="0.5"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.bathrooms}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="surface" className="block text-sm font-medium text-gray-700">
                  Surface (m²)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="surface"
                    id="surface"
                    min="0"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.surface}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center sm:col-span-4">
                <div className="flex items-center h-5">
                  <input
                    id="available"
                    name="available"
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
                    checked={formData.available}
                    onChange={handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="available" className="font-medium text-gray-700">
                    Ce produit est actuellement disponible à la réservation
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section Images */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Photos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Ajoutez des photos de haute qualité de votre bien. La première photo sera utilisée comme photo de couverture.
              </p>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Prévisualisation ${index + 1}`}
                      className="object-cover w-full rounded-md aspect-square"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index, index < formData.existingImages.length)}
                      className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full -mt-2 -mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 px-2 py-1 text-xs text-white bg-blue-500 rounded-tr-md">
                        Photo principale
                      </span>
                    )}
                  </div>
                ))}

                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Plus className="w-12 h-12 text-gray-400" />
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    Ajouter des photos
                  </span>
                  <span className="text-xs text-gray-500">
                    JPG, PNG (max. 5MB)
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section Caractéristiques */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Caractéristiques
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Ajoutez des caractéristiques spécifiques à votre bien (ex: Vue sur mer, Climatisation, etc.)
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {formData.features.map((feature) => (
                <div key={feature.id} className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`feature-name-${feature.id}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom de la caractéristique
                    </label>
                    <input
                      type="text"
                      id={`feature-name-${feature.id}`}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(feature.id, 'name', e.target.value)}
                      placeholder="Ex: Vue sur mer"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`feature-value-${feature.id}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Valeur
                    </label>
                    <input
                      type="text"
                      id={`feature-value-${feature.id}`}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      value={feature.value}
                      onChange={(e) => handleFeatureChange(feature.id, 'value', e.target.value)}
                      placeholder="Ex: Oui"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeFeature(feature.id)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-red-600 bg-white border border-red-300 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-2">
                <button
                  type="button"
                  onClick={addFeature}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-transparent rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une caractéristique
                </button>
              </div>
            </div>
          </div>

          {/* Section Équipements */}
          <div className="pt-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Équipements
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez les équipements disponibles dans votre bien.
              </p>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {amenitiesList.map((amenity) => {
                  const isSelected = formData.amenities.includes(amenity);
                  return (
                    <div
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center p-3 border rounded-md cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded border ${
                          isSelected
                            ? 'bg-primary border-primary text-white'
                            : 'border-gray-400 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {amenity
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Boutons de soumission */}
        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              to="/dashboard/partner/products"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className={`inline-flex justify-center px-6 py-3 ml-3 text-base font-semibold text-white border border-transparent rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                loading || uploading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading || uploading ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2 -ml-1 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {uploading ? 'Téléversement...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2 -ml-1" />
                  {isEditing ? 'Mettre à jour' : 'Publier'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <button type="button" onClick={onClose} className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
        <X className="w-5 h-5 mr-2" />
        Fermer
      </button>
    </div>
  );
};

export default ProductForm;
