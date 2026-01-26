import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import ServiceHero from '../../components/ServiceHero';
import ServiceCard from '@/components/ServiceCard';
import CircuitDetailsModal from '../../components/modals/CircuitDetailsModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Voyage {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  rating: number;
  duration: string;
  tags: string[];
  city: string;
}

interface Ville {
  id: string;
  name: string;
  image: string;
  description: string;
  voyages: Voyage[];
}

// const ImageSlider = ({ images = [] }: { images: string[] }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//
//   useEffect(() => {
//     if (images.length <= 1) return;
//     
//     const timer = setInterval(() => {
//       setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
//     }, 3000);
//     
//     return () => clearInterval(timer);
//   }, [images.length]);
//
//   if (images.length === 0) {
//     return (
//       <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
//         <span className="text-gray-500">Aucune image disponible</span>
//       </div>
//     );
//   }
//
//   return (
//     <div className="relative h-48 w-full overflow-hidden">
//       {images.map((image, index) => (
//         <img
//           key={index}
//           src={image}
//           alt={`Slide ${index + 1}`}
//           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
//             index === currentIndex ? 'opacity-100' : 'opacity-0'
//           }`}
//           loading="lazy"
//           onError={(e) => {
//             (e.target as HTMLImageElement).src = '/assets/hero/hero1.jpg';
//           }}
//         />
//       ))}
//       {images.length > 1 && (
//         <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
//           {images.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => setCurrentIndex(index)}
//               className={`w-2 h-2 rounded-full ${
//                 index === currentIndex ? 'bg-white' : 'bg-white/50'
//               }`}
//               aria-label={`Aller à l'image ${index + 1}`}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

const Tourisme = () => {
  // const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<Voyage | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  useEffect(() => {
    loadCircuits();
  }, []);

  const loadCircuits = async () => {
    try {
      setIsLoading(true);
      console.log('Chargement des circuits...');
      
      // 1. Charger les circuits touristiques
      const { data: circuitsData = [], error: circuitsError } = await supabase
        .from('circuits_touristiques')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (circuitsError) {
        console.error('Erreur circuits_touristiques:', circuitsError);
        throw circuitsError;
      }

      // 2. Charger les circuits des partenaires (optionnel)
      let partnerCircuits: any[] = [];
      try {
        const { data, error: partnerError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('available', true)
          .eq('product_type', 'circuit')
          .order('created_at', { ascending: false });

        if (partnerError) {
          // Erreur non bloquante - la table peut ne pas exister ou avoir des restrictions RLS
          if (partnerError.code !== 'PGRST116' && partnerError.code !== '42501') {
            console.warn('Erreur partner_products (non bloquant):', partnerError.message);
          }
        } else {
          partnerCircuits = data || [];
        }
      } catch (err: any) {
        // Ignorer les erreurs de table manquante ou de permissions
        if (err?.code !== 'PGRST116' && err?.code !== '42501') {
          console.warn('Erreur lors du chargement des circuits partenaires (non bloquant):', err?.message || err);
        }
      }

      console.log('Circuits chargés:', { 
        circuitsCount: circuitsData?.length || 0, 
        partnerCircuitsCount: partnerCircuits?.length || 0 
      });

      // 3. Transformer les circuits en format Ville/Voyage
      const allCircuits = [...(circuitsData || []), ...(partnerCircuits || [])];
      
      if (allCircuits.length === 0) {
        console.warn('Aucun circuit disponible');
        setVilles([]);
        return;
      }
      
      // Grouper par ville/city
      const villesMap = new Map<string, Ville>();
      
      allCircuits.forEach((circuit: any) => {
        try {
          const cityName = circuit.city || circuit.destination || circuit.destinations?.[0] || 'Autres destinations';
          const cityId = cityName.toLowerCase().replace(/\s+/g, '-');
          
          if (!villesMap.has(cityId)) {
            villesMap.set(cityId, {
              id: cityId,
              name: cityName,
              image: Array.isArray(circuit.images) && circuit.images.length > 0 
                ? circuit.images[0] 
                : '/assets/hero/hero1.jpg',
              description: `Découvrez nos circuits à ${cityName}`,
              voyages: []
            });
          }
          
          const ville = villesMap.get(cityId)!;
          
          // Normaliser les tags/destinations
          let tags: string[] = [];
          if (Array.isArray(circuit.destinations)) {
            tags = circuit.destinations;
          } else if (Array.isArray(circuit.tags)) {
            tags = circuit.tags;
          } else if (typeof circuit.destinations === 'string') {
            tags = [circuit.destinations];
          } else if (typeof circuit.tags === 'string') {
            tags = [circuit.tags];
          }
          
          // Normaliser les images
          let images: string[] = [];
          if (Array.isArray(circuit.images)) {
            images = circuit.images;
          } else if (circuit.image) {
            images = [circuit.image];
          } else if (typeof circuit.images === 'string') {
            images = [circuit.images];
          }
          
          ville.voyages.push({
            id: circuit.id,
            title: circuit.title || circuit.name || 'Circuit sans titre',
            description: circuit.description || '',
            images: images,
            price: Number(circuit.price_per_person) || Number(circuit.price) || 0,
            rating: Number(circuit.rating) || 4.5,
            duration: circuit.duration_days ? `${circuit.duration_days} jours` : (circuit.duration || 'N/A'),
            tags: tags,
            city: cityName
          });
        } catch (err) {
          console.error('Erreur lors du traitement d\'un circuit:', err, circuit);
        }
      });

      // Convertir la Map en tableau
      const villesArray = Array.from(villesMap.values());
      setVilles(villesArray);
      
      console.log('Villes formatées:', villesArray);
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error?.message || 'Erreur lors du chargement des circuits';
      setError(errorMessage);
      toast.error(errorMessage);
      setVilles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter une nouvelle ville
  // const _ajouterVille = (nouvelleVille: Omit<Ville, 'id'>) => {
  //   const id = nouvelleVille.name.toLowerCase().replace(/\s+/g, '-');
  //   setVilles([...villes, { ...nouvelleVille, id }]);
  // };

  // Fonction pour ajouter un voyage à une ville
  // const _ajouterVoyage = (villeId: string, nouveauVoyage: Omit<Voyage, 'id' | 'city'>) => {
  //   setVilles(
  //     villes.map((ville) => {
  //       if (ville.id === villeId) {
  //         const id = `${villeId}-${ville.voyages.length + 1}`;
  //         return {
  //           ...ville,
  //           voyages: [...ville.voyages, { ...nouveauVoyage, id, city: villeId }],
  //         };
  //       }
  //       return ville;
  //     })
  //   );
  // };

  // Filtrer les villes et voyages en fonction de la recherche
  const filteredVilles = villes.filter(
    (ville) =>
      ville.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ville.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ville.voyages.some(
        (voyage) =>
          voyage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voyage.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(voyage.tags) && voyage.tags.some((tag: string) => 
            typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
      )
  );

  // Obtenir les voyages de la ville sélectionnée ou tous les voyages
  const voyagesAAfficher = selectedCity
    ? villes.find((v) => v.id === selectedCity)?.voyages || []
    : filteredVilles.flatMap((ville) => ville.voyages);

  // Images pour le hero
  const heroImages = [
    '/assets/hero/A.jpg',
    '/assets/hero/B.jpg',
    '/assets/hero/C.jpg',
    '/assets/hero/D.jpg',
  ].filter(Boolean);

  const handleHeroSearch = (query: string) => {
    setSearchTerm(query);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Si erreur, afficher un message d'erreur
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ServiceHero
          title="Découvrez le Maroc"
          subtitle="Explorez nos circuits touristiques à travers les plus belles villes du Maroc."
          images={heroImages}
          searchPlaceholder="Rechercher une destination, un circuit..."
          onSearch={handleHeroSearch}
        />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Erreur lors du chargement des circuits</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadCircuits();
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si aucune ville n'est chargée et qu'on n'est plus en chargement, afficher un message
  if (!isLoading && villes.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ServiceHero
          title="Découvrez le Maroc"
          subtitle="Explorez nos circuits touristiques à travers les plus belles villes du Maroc."
          images={heroImages}
          searchPlaceholder="Rechercher une destination, un circuit..."
          onSearch={handleHeroSearch}
        />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun circuit disponible pour le moment.</p>
            <p className="text-gray-400 text-sm mt-2">Veuillez réessayer plus tard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceHero
        title="Découvrez le Maroc"
        subtitle="Explorez nos circuits touristiques à travers les plus belles villes du Maroc. Des expériences authentiques et inoubliables vous attendent."
        images={heroImages}
        searchPlaceholder="Rechercher une destination, un circuit..."
        onSearch={handleHeroSearch}
      />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des destinations..."
          />
        </div>

        {/* Filtres par ville */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={() => setSelectedCity(null)}
            className={`px-4 py-2 rounded-full ${
              !selectedCity
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Toutes les destinations
          </button>
          {villes.map((ville) => (
            <button
              key={ville.id}
              onClick={() => setSelectedCity(ville.id)}
              className={`px-4 py-2 rounded-full ${
                selectedCity === ville.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {ville.name}
            </button>
          ))}
        </div>

        {/* Affichage des voyages */}
        {!selectedCity ? (
          // Affichage par ville
          <div className="space-y-16">
            {filteredVilles.length > 0 ? (
              filteredVilles.map((ville) => (
                <div key={ville.id} className="mb-12">
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{ville.name}</h2>
                    <button
                      onClick={() => setSelectedCity(ville.id)}
                      className="ml-4 text-sm text-emerald-600 hover:text-emerald-800"
                    >
                      Voir tout ({ville.voyages.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ville.voyages.slice(0, 3).map((voyage) => (
                      <ServiceCard
                        key={voyage.id}
                        id={voyage.id}
                        title={voyage.title || 'Circuit sans titre'}
                        description={voyage.description || ''}
                        images={Array.isArray(voyage.images) ? voyage.images : []}
                        price={Number(voyage.price) || 0}
                        type="circuit_touristiques"
                        rating={Number(voyage.rating) || 0}
                        duration={voyage.duration || 'N/A'}
                        tags={Array.isArray(voyage.tags) ? voyage.tags : []}
                        link={`/tourisme/${voyage.id}`}
                        onImageClick={() => {
                          setSelectedCircuit(voyage);
                          setIsImageGalleryOpen(true);
                        }}
                        onViewDetails={() => {
                          setSelectedCircuit(voyage);
                          setIsImageGalleryOpen(true);
                        }}
                        className="h-full"
                      />
                    ))}
                  </div>
                  {ville.voyages.length > 3 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setSelectedCity(ville.id)}
                        className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                      >
                        Voir les {ville.voyages.length - 3} autres offres à {ville.name}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucun résultat trouvé pour votre recherche.</p>
              </div>
            )}
          </div>
        ) : (
          // Affichage des voyages d'une ville spécifique
          <div>
            <button
              onClick={() => setSelectedCity(null)}
              className="flex items-center text-emerald-600 mb-6 hover:text-emerald-800"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Retour aux destinations
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Nos offres à {villes.find((v) => v.id === selectedCity)?.name}
            </h2>

            {voyagesAAfficher.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voyagesAAfficher.map((voyage) => (
                  <ServiceCard
                    key={voyage.id}
                    id={voyage.id}
                    title={voyage.title || 'Circuit sans titre'}
                    description={voyage.description || ''}
                    images={Array.isArray(voyage.images) ? voyage.images : []}
                    price={Number(voyage.price) || 0}
                    type="circuit_touristiques"
                    rating={Number(voyage.rating) || 0}
                    duration={voyage.duration || 'N/A'}
                    tags={Array.isArray(voyage.tags) ? voyage.tags : []}
                    link={`/tourisme/${voyage.id}`}
                    onImageClick={() => {
                      setSelectedCircuit(voyage);
                      setIsImageGalleryOpen(true);
                    }}
                    onViewDetails={() => {
                      setSelectedCircuit(voyage);
                      setIsImageGalleryOpen(true);
                    }}
                    className="h-full"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Aucun circuit disponible pour cette ville.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Circuit Details Modal */}
      {selectedCircuit && (
        <CircuitDetailsModal
          circuit={{
            id: selectedCircuit.id,
            title: selectedCircuit.title || 'Circuit sans titre',
            description: selectedCircuit.description || '',
            images: Array.isArray(selectedCircuit.images) ? selectedCircuit.images : [],
            price: Number(selectedCircuit.price) || 0,
            rating: Number(selectedCircuit.rating) || 0,
            duration: selectedCircuit.duration || 'N/A',
            city: selectedCircuit.city,
            tags: Array.isArray(selectedCircuit.tags) ? selectedCircuit.tags : [],
          }}
          isOpen={isImageGalleryOpen}
          onClose={() => {
            setIsImageGalleryOpen(false);
            setSelectedCircuit(null);
          }}
        />
      )}
    </div>
  );
};

export default Tourisme;