// filepath: /Users/jamilaaitbouchnani/Downloads/marocsoleil-main/src/Pages/dashboards/partner/ProductForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

type ProductType = 'appartement' | 'villa' | 'hotel' | 'voiture' | 'circuit';
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
  const [imageInput, setImageInput] = useState<string>('');

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
        main_image: p?.main_image ?? p?.image ?? ''
      }));
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
        main_image: ''
      });
      setFeatures([createEmptyFeature()]);
      setImageInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct]);

  const buildProductPayload = useMemo(() => {
    return (overrides: Record<string, any> = {}) => ({
      ...formData,
      ...overrides,
      features: features.map(f => ({ name: f.name, value: f.value })),
    });
  }, [formData, features]);

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

      const missingColumnRegex = /Could not find the '([^']+)' column of 'partner_products' in the schema cache/i;
      let payload: Record<string, any> = buildProductPayload({
         partner_id: user.id,
         updated_at: new Date().toISOString()
       });

      const performUpsert = async (p: any) => {
        if (editingProduct && editingProduct.id) {
          return supabase
            .from('partner_products')
            .update(p)
            .eq('id', editingProduct.id)
            .eq('partner_id', user.id);
        }
        return supabase
          .from('partner_products')
          .insert([{ ...p, created_at: new Date().toISOString() }])
          .select()
          .single();
      };

      let result: any = null;
      const maxAttempts = 6;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          result = await performUpsert(payload);
        } catch (err: any) {
          const msg = (err?.message || err?.error?.message || '').toString();
          const m = msg.match(missingColumnRegex);
          if (m && m[1]) {
            delete payload[m[1]];
            console.warn('[ProductForm] missing column removed from payload:', m[1]);
            continue;
          }
          throw err;
        }

        if (result?.error) {
          const msg = (result.error?.message || '').toString();
          const m = msg.match(missingColumnRegex);
          if (m && m[1]) {
            delete payload[m[1]];
            console.warn('[ProductForm] missing column in result removed from payload:', m[1]);
            continue;
          }
          throw result.error;
        }
        break;
      }

      if (!result || result?.error) throw result?.error || new Error('Erreur lors de la sauvegarde du produit');

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
              </select>
            </div>

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
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Équipements</h4>
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

          {/* Images Section */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>

            {/* Image URL Input */}
            <div className="flex gap-2 mt-2">
              <input
                placeholder="https://example.com/image.jpg"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="px-3 py-2 rounded border border-gray-300 flex-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Ajouter
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ajoutez l'URL d'une image hébergée sur un service comme Imgur, Cloudinary, etc.
            </p>

            {/* Image Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image principale (la première sera utilisée par défaut)
              </label>
              <div className="flex flex-wrap gap-3">
                {(formData.images || []).map((img: string, index: number) => (
                  <div key={img} className="relative group">
                    <div className="w-32 h-32 border rounded overflow-hidden">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {formData.main_image === img ? (
                          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                            Principale
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, main_image: img }))}
                            className="bg-white text-emerald-600 text-xs px-2 py-1 rounded hover:bg-emerald-50"
                          >
                            Définir comme principale
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {formData.images?.length === 0 && (
                <p className="text-gray-400 text-sm mt-2">Aucune image ajoutée</p>
              )}
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

