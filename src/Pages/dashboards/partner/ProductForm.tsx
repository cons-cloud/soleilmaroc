// filepath: /Users/jamilaaitbouchnani/Downloads/marocsoleil-main/src/Pages/dashboards/partner/ProductForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Upload, Utensils } from 'lucide-react';

type ProductType = 'appartement' | 'villa' | 'hotel' | 'voiture' | 'circuit' | 'restaurant' | 'evenement';
type PriceType = 'per_night' | 'per_day' | 'per_person';

interface Feature { id: string; name: string; value: string; }
interface ProductFormData { [key: string]: any }

interface ProductFormProps {
  onClose?: () => void;
  onCreate?: () => void;
  editingProduct?: any | null;
}

const createEmptyFeature = (): Feature => ({ id: uuidv4(), name: '', value: '' });

const parseFeatures = (input: any): Feature[] => {
  if (!input) return [];
  try {
    return Array.isArray(input) ? input.map((f: any) => ({ id: f.id || uuidv4(), name: f.name || '', value: f.value || '' })) : [];
  } catch {
    return [];
  }
};

const amenitiesList = [
  'wifi', 'piscine', 'parking', 'climatisation', 'chauffage',
  'cuisine_equipee', 'tv', 'lave_linge', 'seche_linge', 'terrasse',
  'jardin', 'vue_mer', 'vue_montagne', 'acces_plage', 'piscine_chauffee'
];

const ProductForm: React.FC<ProductFormProps> = ({ onClose = () => {}, onCreate, editingProduct }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    product_type: 'appartement' as ProductType,
    price_type: 'per_night' as PriceType,
    city: '',
    address: '',
    available: true,
    features: [],
    amenities: [],
    images: [],
    main_image: ''
  });
  const [features, setFeatures] = useState<Feature[]>([createEmptyFeature()]);
  const [menu, setMenu] = useState<any[]>([]);
  const [imageInput, setImageInput] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      const p = editingProduct;
      setFormData(prev => ({
        ...prev,
        ...p,
        price: Number(p?.price ?? p?.prix ?? 0),
        features: parseFeatures(p?.features),
        amenities: p?.amenities ?? [],
        images: p?.images ?? [],
        main_image: p?.main_image ?? p?.image ?? '',
        cuisine_type: p?.cuisine_type || '',
        price_range: p?.price_range || '$$',
      }));
      setMenu(p?.menu || []);
      const parsed = parseFeatures(p?.features);
      setFeatures(parsed.length ? parsed : [createEmptyFeature()]);
    } else {
      setFormData({
        title: '',
        description: '',
        price: 0,
        product_type: 'appartement',
        price_type: 'per_night',
        city: '',
        address: '',
        available: true,
        features: [],
        amenities: [],
        images: [],
        main_image: '',
        cuisine_type: '',
        price_range: '$$',
      });
      setMenu([]);
      setFeatures([createEmptyFeature()]);
      setImageInput('');
    }
  }, [editingProduct]);

  const addMenuItem = () => setMenu(prev => [...prev, { name: '', description: '', price: 0 }]);
  const removeMenuItem = (index: number) => setMenu(prev => prev.filter((_, i) => i !== index));
  const updateMenuItem = (index: number, key: string, value: any) => {
    setMenu(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const buildProductPayload = useMemo(() => {
    return (overrides: Record<string, any> = {}) => ({
      ...formData,
      ...overrides,
      features: features.map(f => ({ name: f.name, value: f.value })),
      menu: menu,
    });
  }, [formData, features, menu]);

  const addFeature = () => setFeatures(prev => [...prev, createEmptyFeature()]);
  const removeFeature = (id: string) => setFeatures(prev => prev.filter(f => f.id !== id));
  const updateFeature = (id: string, key: 'name' | 'value', value: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const current = new Set(prev.amenities || []);
      if (current.has(amenity)) current.delete(amenity); else current.add(amenity);
      return { ...prev, amenities: Array.from(current) };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const bucketMap: Record<string, string> = {
        'restaurant': 'restaurants_marocsoleil',
        'hotel': 'hotels_marocsoleil',
        'villa': 'villas_marocsoleil',
        'appartement': 'appartements_marocsoleil',
        'voiture': 'voitures_marocsoleil',
        'circuit': 'circuits_marocsoleil',
        'evenement': 'evenements_marocsoleil'
      };
      const bucket = bucketMap[formData.product_type] || 'services_marocsoleil';
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (isMain) {
        setFormData(prev => ({ 
          ...prev, 
          main_image: publicUrl,
          images: prev.images.includes(publicUrl) ? prev.images : [publicUrl, ...prev.images]
        }));
        toast.success('Image principale ajoutée');
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), publicUrl]
        }));
        toast.success('Image ajoutée à la galerie');
      }
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageUrl = () => {
    const url = imageInput.trim();
    if (!url) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), url],
      main_image: prev.main_image || url
    }));
    setImageInput('');
  };

  const removeImage = (url: string) => {
    setFormData(prev => {
      const imgs = (prev.images || []).filter((i: string) => i !== url);
      const main = prev.main_image === url ? (imgs[0] || '') : prev.main_image;
      return { ...prev, images: imgs, main_image: main };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error('Utilisateur non authentifié');

      // Mapping des types de produits aux tables spécifiques
      const tableMapping: Record<string, string> = {
        'appartement': 'appartements_marocsoleil',
        'villa': 'villas_marocsoleil',
        'hotel': 'hotels_marocsoleil',
        'voiture': 'locations_voitures_marocsoleil',
        'circuit': 'circuits_touristiques_marocsoleil',
        'restaurant': 'restaurants_marocsoleil',
        'evenement': 'evenements_marocsoleil'
      };

      const tableName = tableMapping[formData.product_type] || 'partner_products_marocsoleil';


      let payload = buildProductPayload({
        updated_at: new Date().toISOString()
      });

      // Préparer le payload final et le nettoyer selon la table
      let finalPayload: Record<string, any> = {
        title: formData.title || formData.name,
        description: formData.description,
        city: formData.city,
        address: formData.address,
        images: formData.images,
        available: formData.available,
        featured: formData.featured,
        updated_at: new Date().toISOString(),
        user_id: user.id,
        partner_id: user.id,
        created_by: user.id
      };

      // Mapper le prix selon la table
      if (tableName === 'locations_voitures_marocsoleil') {
        finalPayload.price_per_day = formData.price;
        finalPayload.marque = formData.title;
        finalPayload.disponible = formData.available;
        finalPayload.en_vedette = formData.featured;
      } else if (tableName === 'hotels_marocsoleil' || tableName === 'villas_marocsoleil' || tableName === 'appartements_marocsoleil') {
        finalPayload.price_per_night = formData.price;
        finalPayload.amenities = formData.amenities;
      } else if (tableName === 'circuits_touristiques_marocsoleil') {
        finalPayload.price_per_person = formData.price;
      } else if (tableName === 'evenements_marocsoleil') {
        finalPayload.price = formData.price;
        finalPayload.location = formData.city;
      } else if (tableName === 'restaurants_marocsoleil') {
        finalPayload.cuisine_type = formData.cuisine_type;
        finalPayload.price_range = formData.price_range;
        finalPayload.menu = menu;
      } else if (tableName === 'annonces_marocsoleil') {
        finalPayload.price = formData.price;
        finalPayload.category = formData.category;
      } else {
        // Fallback pour partner_products_marocsoleil ou autre
        finalPayload = { ...payload, user_id: user.id, partner_id: user.id, created_by: user.id };
      }

      // S'assurer que 'title' est présent si la table l'utilise, 'name' sinon
      if (tableName === 'hotels_marocsoleil' || tableName === 'restaurants_marocsoleil') {
        finalPayload.name = formData.title;
        delete finalPayload.title;
      }

      const performUpsert = async (p: any) => {
        if (editingProduct && editingProduct.id) {
          return supabase
            .from(tableName)
            .update(p)
            .eq('id', editingProduct.id);
        }
        return supabase
          .from(tableName)
          .insert([{ ...p, created_at: new Date().toISOString() }])
          .select()
          .single();
      };

      const result = await performUpsert(finalPayload);

      if (result?.error) throw result.error;

      toast.success(editingProduct ? 'Produit mis à jour' : 'Produit créé');
      onCreate && onCreate();
      onClose();
    } catch (err: any) {
      console.error('[ProductForm] Erreur lors de la soumission du formulaire:', err);
      toast.error(err?.message || 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Titre *</label>
              <input
                required
                value={formData.title ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prix *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={Number(formData.price ?? 0)}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type de produit *</label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="hotel">Hôtel</option>
                <option value="voiture">Location de voiture</option>
                <option value="circuit">Tourisme / Circuit</option>
                <option value="restaurant">Restaurant / Gastronomie</option>
                <option value="evenement">Événement</option>
              </select>
            </div>

            {formData.product_type === 'restaurant' && (
              <div className="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                    Gestion du Menu
                  </h3>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span>+</span> Ajouter un plat
                  </button>
                </div>

                <div className="space-y-4">
                  {menu.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                      <button
                        type="button"
                        onClick={() => removeMenuItem(index)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                          <input
                            placeholder="Nom du plat"
                            value={item.name}
                            onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Prix (MAD)"
                            value={item.price}
                            onChange={(e) => updateMenuItem(index, 'price', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <input
                            placeholder="URL photo du plat (optionnel)"
                            value={item.photo || ''}
                            onChange={(e) => updateMenuItem(index, 'photo', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="lg:col-span-4">
                          <textarea
                            placeholder="Description du plat (ingrédients, etc.)"
                            value={item.description}
                            onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-emerald-500 min-h-[60px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {menu.length === 0 && (
                    <div className="text-center py-8 text-gray-400 italic text-sm">
                      Aucun plat ajouté au menu pour le moment.
                    </div>
                  )}
                </div>
              </div>
            )}

            {['appartement', 'villa', 'hotel', 'voiture', 'circuit'].includes(formData.product_type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de prix *</label>
                <select
                  value={formData.price_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="per_night">Par nuit</option>
                  <option value="per_day">Par jour</option>
                  <option value="per_person">Par personne</option>
                </select>
              </div>
            )}
            
            {formData.product_type === 'restaurant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de Cuisine</label>
                  <input
                    value={formData.cuisine_type ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
                    placeholder="Ex: Marocaine, Italienne..."
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gamme de Prix</label>
                  <select
                    value={formData.price_range ?? '$$'}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="$">Économique ($)</option>
                    <option value="$$">Moyen ($$)</option>
                    <option value="$$$">Haut de gamme ($$$)</option>
                    <option value="$$$$">Luxe ($$$$)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Ville *</label>
              <input
                required
                value={formData.city ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              <input
                value={formData.address ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Disponibilité</label>
              <select
                value={String(Boolean(formData.available))}
                onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.value === 'true' }))}
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Décrivez votre produit en détail..."
            />
          </div>

          {/* Features Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Caractéristiques</h4>
              <button
                type="button"
                onClick={addFeature}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                + Ajouter une caractéristique
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {features.map(f => (
                <div key={f.id} className="flex gap-2 items-center">
                  <input
                    placeholder="Nom (ex: Surface, Chambres, Capacité...)"
                    value={f.name}
                    onChange={(e) => updateFeature(f.id, 'name', e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300 w-1/3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    placeholder="Valeur (ex: 100m², 3, 4 personnes...)"
                    value={f.value}
                    onChange={(e) => updateFeature(f.id, 'value', e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300 flex-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(f.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities Section */}
          {['appartement', 'villa', 'hotel'].includes(formData.product_type) && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Équipements du Logement</h4>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {amenitiesList.map(a => (
                  <label key={a} className="inline-flex items-center gap-2 text-sm p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={(formData.amenities || []).includes(a)}
                      onChange={() => toggleAmenity(a)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="capitalize">{a.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.product_type === 'voiture' && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Options du Véhicule</h4>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm p-2 border rounded">
                  <span className="capitalize">Sièges</span>
                  <input type="number" value={formData.places || 4} onChange={(e) => setFormData(prev => ({ ...prev, places: Number(e.target.value) }))} className="ml-2 w-16 p-1 border rounded" />
                </label>
                <label className="inline-flex items-center gap-2 text-sm p-2 border rounded">
                  <span className="capitalize">Portes</span>
                  <input type="number" value={formData.portes || 4} onChange={(e) => setFormData(prev => ({ ...prev, portes: Number(e.target.value) }))} className="ml-2 w-16 p-1 border rounded" />
                </label>
              </div>
            </div>
          )}

          {/* Images Section */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>

            {/* Main Image Upload */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Image principale *</label>
              <div className="flex items-center gap-4">
                {formData.main_image ? (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                    <img src={formData.main_image} alt="Main" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, main_image: '' }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-[10px] text-gray-500 mt-1">Uploader</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                  </label>
                )}
                <div className="text-xs text-gray-500">
                  C'est l'image qui sera affichée en premier.
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">Galerie d'images</label>
              <div className="flex flex-wrap gap-3">
                {(formData.images || []).map((img: string, index: number) => (
                  <div key={img} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                    <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(img)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
                
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-6 h-6 text-gray-400" />
                      <span className="text-[10px] text-gray-500 mt-1">Ajouter</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            {/* Image URL Input (Fallback) */}
            <div className="flex gap-2">
              <input
                placeholder="Ou collez l'URL d'une image..."
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="px-3 py-2 text-sm rounded border border-gray-300 flex-1 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                Ajouter URL
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                editingProduct ? 'Mettre à jour le produit' : 'Créer le produit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

