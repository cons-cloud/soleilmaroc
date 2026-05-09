import { Link } from 'react-router-dom';
import { Home, Search, Compass, ChevronRight } from 'lucide-react';

const PageNotFound = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1a1c1e]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/images/404_bg.png" 
          alt="Moroccan Landscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 py-12 text-center text-white">
        {/* Glass Container */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/20 rounded-2xl mb-8 border border-emerald-500/30">
            <Compass className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-8xl font-black mb-4 tracking-tighter opacity-90 leading-none">
            404
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            L'oasis est introuvable
          </h2>
          
          <p className="text-lg text-emerald-50/70 mb-10 leading-relaxed max-w-md mx-auto">
            Il semble que vous vous soyez aventuré un peu trop loin dans les dunes. Cette page n'existe pas ou s'est perdue dans le désert.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/40 active:scale-95 w-full sm:w-auto"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/recherche"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md active:scale-95 w-full sm:w-auto"
            >
              <Search className="w-5 h-5" />
              Lancer une recherche
            </Link>
          </div>
        </div>

        {/* Brand name */}
        <div className="mt-12 opacity-50">
          <span className="text-sm tracking-[0.3em] font-light uppercase">Maroc Soleil 2026</span>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;