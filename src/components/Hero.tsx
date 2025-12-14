import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const slides = [
  {
    id: 1,
    title: "Découvrez les merveilles du Maroc",
    subtitle: "Des paysages à couper le souffle vous attendent",
    image: "/assets/hero/A.jpg",
    cta: "Explorer maintenant"
  },
  {
    id: 2,
    title: "Séjours inoubliables",
    subtitle: "Trouvez l'hébergement parfait pour vos vacances",
    image: "/assets/hero/B.jpg",
    cta: "Voir les offres"
  },
  {
    id: 3,
    title: "Aventures en plein air",
    subtitle: "Découvrez des expériences uniques",
    image: "/assets/hero/C.jpg",
    cta: "Découvrir"
  },
  {
    id: 4,
    title: "Culture et traditions",
    subtitle: "Plongez dans l'authenticité marocaine",
    image: "/assets/hero/D.jpg",
    cta: "En savoir plus"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Préchargement des images pour améliorer les performances
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      nextSlide();
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlide, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers la page de recherche avec le terme de recherche
      window.location.href = `/recherche?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative h-[90vh] overflow-hidden">
      {/* Images en arrière-plan qui défilent avec effet parallaxe */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${slide.image})`,
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
              backgroundAttachment: 'fixed'
            }}
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
            animate={{ 
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.05,
              y: index === currentSlide ? 0 : 30,
              filter: index === currentSlide ? 'blur(0px)' : 'blur(2px)'
            }}
            transition={{ 
              duration: 2.5,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 2 },
              scale: { duration: 2.5 },
              filter: { duration: 1.5 }
            }}
            whileHover={{ scale: 1.01 }}
          />
        ))}
        {/* Overlay avec dégradé pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60"></div>
        
        {/* Effet de particules flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <button 
        onClick={() => {
          setIsAutoPlaying(false);
          prevSlide();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-yellow-200/90 text-gray-800 hover:bg-yellow-200 hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="Précédent"
      >
        <FiChevronLeft size={24} />
      </button>
      
      <button 
        onClick={() => {
          setIsAutoPlaying(false);
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-yellow-200/90 text-gray-800 hover:bg-yellow-200 hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="Suivant"
      >
        <FiChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              goToSlide(index);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md ${currentSlide === index ? 'bg-yellow-200 w-8 shadow-lg' : 'bg-yellow-200/60 hover:bg-yellow-400/90'}`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              {slides[currentSlide] ? slides[currentSlide].title : ''}
            </h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-md">
              {slides[currentSlide] ? slides[currentSlide].subtitle : ''}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service, une destination..."
                className="flex-grow px-6 py-4 rounded-full text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white border-2 border-white/50 shadow-lg"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Rechercher
              </button>
            </form>
          </motion.div>
          
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <a 
              href="services" 
                   className="inline-flex items-center bg-yellow-200 text-black px-6 py-3 rounded-full font-medium hover:bg-yellow-200 transition-all duration-300 transform hover:scale-105"
            >
              {slides[currentSlide] ? slides[currentSlide].cta : ''}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;