import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Filter, MapPin, Car, Building, Plane, Loader } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'tourism' | 'car' | 'property';
  path: string;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  location: string;
}

const Recherche = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const term = query.trim();
      const searchTerm = `%${term}%`;
      const allResults: SearchResult[] = [];

      // Recherche dans les circuits touristiques
      if (selectedFilters.includes('all') || selectedFilters.includes('tourism')) {
        const { data: circuits, error: circuitsError } = await supabase
          .from('circuits_touristiques')
          .select('*')
          .or(`title.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .eq('available', true)
          .limit(20);

        if (circuitsError) {
          console.warn('[Recherche] circuits_touristiques search error:', circuitsError);
        }

        if (circuits) {
          allResults.push(...circuits.map((c: any) => ({
            id: c.id,
            type: 'tourism' as const,
            path: `/tourisme/${c.id}`,
            title: c.title,
            subtitle: c.city || c.destination || 'Circuit',
            price: Number(c.price_per_person ?? c.price ?? 0),
            image: c.images?.[0] || '/placeholder.jpg',
            location: c.city || c.destination || ''
          })));
        }

        // Recherche dans les activités touristiques
        const { data: activities, error: activitiesError } = await supabase
          .from('activites_touristiques')
          .select('*')
          .or(`title.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .eq('available', true)
          .limit(20);

        if (activitiesError) {
          console.warn('[Recherche] activites_touristiques search error:', activitiesError);
        }

        if (activities) {
          allResults.push(...activities.map((a: any) => ({
            id: a.id,
            type: 'tourism' as const,
            path: `/services/activites`,
            title: a.title,
            subtitle: a.city || a.location || 'Activité',
            price: Number(a.price_per_person ?? a.price ?? 0),
            image: a.images?.[0] || '/placeholder.jpg',
            location: a.city || a.location || ''
          })));
        }

        // Recherche dans les circuits partenaires
        const { data: partnerCircuits, error: partnerCircuitsError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('available', true)
          .eq('product_type', 'circuit')
          .or(`title.ilike.${searchTerm},name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(20);

        if (partnerCircuitsError) {
          console.warn('[Recherche] partner_products(circuit) search error:', partnerCircuitsError);
        }

        if (partnerCircuits) {
          allResults.push(
            ...partnerCircuits.map((p: any) => ({
              id: p.id,
              type: 'tourism' as const,
              path: `/tourisme/${p.id}`,
              title: p.title || p.name || 'Circuit',
              subtitle: p.city || 'Circuit',
              price: Number(p.price_per_person ?? p.price ?? 0),
              image: (Array.isArray(p.images) && p.images[0]) || p.main_image || '/placeholder.jpg',
              location: p.city || ''
            }))
          );
        }
      }

      // Recherche dans les voitures
      if (selectedFilters.includes('all') || selectedFilters.includes('car')) {
        const { data: cars, error: carsError } = await supabase
          .from('locations_voitures')
          .select('*')
          .or(`marque.ilike.${searchTerm},modele.ilike.${searchTerm},ville.ilike.${searchTerm}`)
          .eq('disponible', true)
          .limit(20);

        if (carsError) {
          console.warn('[Recherche] locations_voitures search error:', carsError);
        }

        if (cars) {
          allResults.push(...cars.map((c: any) => ({
            id: c.id,
            type: 'car' as const,
            path: `/voitures/${c.id}`,
            title: `${c.marque || ''} ${c.modele || ''}`.trim() || 'Voiture',
            subtitle: `${c.annee || ''}${c.type_carburant ? ` • ${c.type_carburant}` : ''}`.trim(),
            price: Number(c.prix_jour ?? c.prix ?? 0),
            image: c.images?.[0] || '/placeholder.jpg',
            location: c.ville || ''
          })));
        }

        const { data: partnerCars, error: partnerCarsError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('available', true)
          .eq('product_type', 'voiture')
          .or(`title.ilike.${searchTerm},name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm},marque.ilike.${searchTerm},modele.ilike.${searchTerm}`)
          .limit(20);

        if (partnerCarsError) {
          console.warn('[Recherche] partner_products(voiture) search error:', partnerCarsError);
        }

        if (partnerCars) {
          allResults.push(
            ...partnerCars.map((p: any) => ({
              id: p.id,
              type: 'car' as const,
              path: `/voitures/${p.id}`,
              title: `${p.marque || ''} ${p.modele || ''}`.trim() || p.title || p.name || 'Voiture',
              subtitle: `${p.annee || ''}`.trim(),
              price: Number(p.price_per_day ?? p.price ?? 0),
              image: (Array.isArray(p.images) && p.images[0]) || p.main_image || '/placeholder.jpg',
              location: p.city || ''
            }))
          );
        }
      }

      // Recherche dans les propriétés
      if (selectedFilters.includes('all') || selectedFilters.includes('property')) {
        // Appartements
        const { data: apartments, error: apartmentsError } = await supabase
          .from('appartements')
          .select('*')
          .or(`title.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .eq('available', true)
          .limit(20);

        if (apartmentsError) {
          console.warn('[Recherche] appartements search error:', apartmentsError);
        }

        if (apartments) {
          allResults.push(...apartments.map((a: any) => ({
            id: a.id,
            type: 'property' as const,
            path: `/appartements/${a.id}`,
            title: a.title,
            subtitle: `Appartement • ${a.bedrooms} chambres`,
            price: Number(a.price_per_night ?? 0),
            image: a.images?.[0] || '/placeholder.jpg',
            location: a.city
          })));
        }

        // Villas
        const { data: villas, error: villasError } = await supabase
          .from('villas')
          .select('*')
          .or(`title.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .eq('available', true)
          .limit(20);

        if (villasError) {
          console.warn('[Recherche] villas search error:', villasError);
        }

        if (villas) {
          allResults.push(...villas.map((v: any) => ({
            id: v.id,
            type: 'property' as const,
            path: `/villas/${v.id}`,
            title: v.title,
            subtitle: `Villa • ${v.bedrooms} chambres`,
            price: Number(v.price_per_night ?? 0),
            image: v.images?.[0] || '/placeholder.jpg',
            location: v.city
          })));
        }

        // Hôtels
        const { data: hotels, error: hotelsError } = await supabase
          .from('hotels')
          .select('*')
          .or(`name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .eq('available', true)
          .limit(20);

        if (hotelsError) {
          console.warn('[Recherche] hotels search error:', hotelsError);
        }

        if (hotels) {
          allResults.push(...hotels.map((h: any) => ({
            id: h.id,
            type: 'property' as const,
            path: `/hotels/${h.id}`,
            title: h.name,
            subtitle: `Hôtel ${h.stars}★`,
            price: Number(h.price_per_night ?? 0),
            image: h.images?.[0] || '/placeholder.jpg',
            location: h.city
          })));
        }

        // Produits partenaires (appartement / villa / hotel)
        const { data: partnerProps, error: partnerPropsError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('available', true)
          .in('product_type', ['appartement', 'villa', 'hotel'])
          .or(`title.ilike.${searchTerm},name.ilike.${searchTerm},city.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(30);

        if (partnerPropsError) {
          console.warn('[Recherche] partner_products(property) search error:', partnerPropsError);
        }

        if (partnerProps) {
          allResults.push(
            ...partnerProps.map((p: any) => {
              const basePath =
                p.product_type === 'hotel'
                  ? '/hotels'
                  : p.product_type === 'villa'
                  ? '/villas'
                  : '/appartements';
              const label =
                p.product_type === 'hotel' ? 'Hôtel' : p.product_type === 'villa' ? 'Villa' : 'Appartement';
              const price = Number(p.price_per_night ?? p.price ?? 0);
              return {
                id: p.id,
                type: 'property' as const,
                path: `${basePath}/${p.id}`,
                title: p.title || p.name || label,
                subtitle: `${label} • Partenaire`,
                price,
                image: (Array.isArray(p.images) && p.images[0]) || p.main_image || '/placeholder.jpg',
                location: p.city || ''
              };
            })
          );
        }
      }

      // Dédupliquer (au cas où un item match plusieurs sources)
      const deduped = Array.from(
        new Map(allResults.map((r) => [`${r.type}:${r.id}:${r.path}`, r])).values()
      );

      setResults(deduped);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setSelectedFilters(['all']);
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter(f => f !== filter)
        : [...selectedFilters.filter(f => f !== 'all'), filter];
      
      setSelectedFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [selectedFilters]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'tourism': return Plane;
      case 'car': return Car;
      case 'property': return Building;
      default: return MapPin;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tourism': return 'Tourisme';
      case 'car': return 'Voiture';
      case 'property': return 'Hébergement';
      default: return '';
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Résultats de recherche
              </h1>
              
              {/* Barre de recherche */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une destination, un service..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              {/* Filtres */}
              <div className="flex items-center space-x-4 mb-6">
                <Filter className="h-5 w-5 text-gray-600" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilters.includes('all')
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => toggleFilter('tourism')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilters.includes('tourism')
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    <Plane className="h-4 w-4 inline mr-2" />
                    Tourisme
                  </button>
                  <button
                    onClick={() => toggleFilter('car')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilters.includes('car')
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    <Car className="h-4 w-4 inline mr-2" />
                    Voitures
                  </button>
                  <button
                    onClick={() => toggleFilter('property')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilters.includes('property')
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    <Building className="h-4 w-4 inline mr-2" />
                    Hébergements
                  </button>
                </div>
              </div>

              {/* Nombre de résultats */}
              {!loading && searchQuery && (
                <p className="text-gray-600">
                  {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''} pour "{searchQuery}"
                </p>
              )}
            </div>

            {/* Résultats */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? `Aucun résultat pour "${searchQuery}". Essayez avec d'autres mots-clés.`
                    : 'Commencez votre recherche en tapant un mot-clé ci-dessus.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => {
                  const Icon = getIcon(result.type);
                  return (
                    <div key={`${result.type}-${result.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-48">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start space-x-2 mb-2">
                          <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                            <p className="text-sm text-gray-600">{result.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <MapPin className="h-4 w-4 mr-1" />
                          {result.location}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">
                            {result.price.toLocaleString()} MAD
                            <span className="text-sm font-normal text-gray-500">
                              {result.type === 'car' ? '/jour' : result.type === 'property' ? '/nuit' : ''}
                            </span>
                          </p>
                          <button
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            onClick={() => navigate(result.path)}
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Recherche;
