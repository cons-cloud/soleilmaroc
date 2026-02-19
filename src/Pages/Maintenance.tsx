import React from 'react';
import { Phone, Mail, MapPin, Clock, Loader2, Zap } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Arrière-plan avec image et overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/APT/Essaouira/apt1/1.jpg" 
          alt="Maroc Soleil" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-blue-900/50"></div>
      </div>
      
      {/* Carte de contenu */}
      <div className="max-w-4xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden z-10 transform transition-all duration-500 hover:scale-[1.01]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/APT/AGADIR/APPART1/6.jpg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-yellow-300 animate-pulse mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-white">
                Site en maintenance
              </h1>
            </div>
            <p className="text-blue-100 text-xl font-light">
              Nous travaillons dur pour améliorer votre expérience
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-yellow-300 animate-bounce"></span>
              <span className="h-2 w-2 rounded-full bg-yellow-300 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="h-2 w-2 rounded-full bg-yellow-300 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="h-14 w-14 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              Nous serons bientôt de retour !
            </h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed">
              Notre site est en cours de maintenance pour des améliorations majeures qui rendront votre expérience encore plus exceptionnelle.
              <span className="block mt-3 text-blue-600 font-medium">
                Merci de votre compréhension et à très bientôt !
              </span>
            </p>
            
            {/* Barre de progression */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Chargement...</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-2.5 rounded-full w-[85%] transition-all duration-1000 ease-out"></div>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="mt-16 space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 relative inline-block">
                <span className="relative z-10 px-4 bg-white">
                  Contactez-nous
                </span>
                <span className="absolute left-0 right-0 h-px bg-gray-200 top-1/2 -z-0"></span>
              </h3>
              <p className="text-gray-500">Nous sommes disponibles pour vous aider</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="shrink-0 bg-blue-100 p-2 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Téléphone</p>
                  <div className="mt-1 space-y-1">
                    <a href="tel:+212522123456" className="text-blue-600 hover:text-blue-800">+212 522 123 456</a>
                    <p className="text-sm text-gray-500">Lun-Ven: 9h-18h</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="shrink-0 bg-blue-100 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <a href="mailto:contact@marocsoleil.com" className="text-blue-600 hover:text-blue-800 block mt-1">
                    contact@marocsoleil.com
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="shrink-0 bg-blue-100 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Adresse</p>
                  <p className="text-gray-600 mt-1">123 Avenue Mohammed V, Casablanca, Maroc</p>
                </div>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="pt-4 mt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-4">Suivez-nous :</p>
              <div className="flex justify-center space-x-6 mb-4">
                <a href="https://facebook.com/marocsoleil" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://instagram.com/marocsoleil" target="_blank" rel="noopener noreferrer" 
                   className="text-pink-600 hover:text-pink-800 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com/marocsoleil" target="_blank" rel="noopener noreferrer" 
                   className="text-sky-500 hover:text-sky-700 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://wa.me/212612345678" target="_blank" rel="noopener noreferrer" 
                   className="text-green-500 hover:text-green-700 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.173.199-.347.221-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.781-1.66-2.08-.173-.309-.018-.476.13-.629.136-.135.297-.354.445-.519.149-.173.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.508a.69.69 0 00-.49.173c-.173.124-.66.644-.66 1.567 0 .922.67 1.815.762 1.94.092.125 1.262 2.12 3.06 2.977.564.335 1.005.532 1.35.684.563.252.07 1.188.07 1.188s1.755-.407 1.902-1.5c.148-1.09 1.116-1.038.968-1.733z" />
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 2.42.7 4.68 1.907 6.592L0 24l5.41-1.78A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm0 22.1c-2.09 0-4.07-.54-5.8-1.49l-.414-.246-4.3 1.415 1.15-4.21-.27-.43A9.93 9.93 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-8 py-6 text-center border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Maroc Soleil. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
