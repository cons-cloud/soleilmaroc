import { Suspense, lazy, useState } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { SiteContentProvider } from "./contexts/SiteContentContext";
import RoleGuard from "./components/RoleGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { ROUTES } from "./config/routes";
import { SEO } from "./components/SEO";
import LoadingSpinner from "./components/LoadingSpinner";

// Configuration de la maintenance
export const MAINTENANCE_MODE = false; // Mode maintenance désactivé
export const MAINTENANCE_BYPASS_SECRET = 'maroc-soleil-2026'; // Mot de passe pour accéder au site en mode maintenance

// Fonction utilitaire pour vérifier si on peut contourner la maintenance
const checkMaintenanceBypass = () => {
  if (!MAINTENANCE_MODE) return true;
  
  // Vérifier le paramètre d'URL
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('maintenance') === MAINTENANCE_BYPASS_SECRET) {
      sessionStorage.setItem('bypassMaintenance', 'true');
      return true;
    }
    
    // Vérifier le stockage de session
    if (sessionStorage.getItem('bypassMaintenance') === 'true') {
      return true;
    }
  }
  
  return false;
};





// Composants de pages
const Maintenance = lazy(() => import("./Pages/Maintenance"));

// Composants de mise en page (imports statiques pour éviter les problèmes Suspense)
import DashboardLayout from './components/DashboardLayout';
import ClientPageLayout from './components/ClientPageLayout';
const Navbar = lazy(() => import("./components/Navbar"));
const Footer = lazy(() => import("./components/Footer"));
const BookingForm = lazy(() => import("./components/BookingForm"));

// Pages publiques
const Home = lazy(() => import("./Pages/Home"));
const Services = lazy(() => import("./Pages/Services"));
const Evenements = lazy(() => import("./Pages/Evenements"));
const Annonces = lazy(() => import("./Pages/Annonces"));
const Apropos = lazy(() => import("./Pages/Apropos"));
const Contact = lazy(() => import("./Pages/Contact"));
const Login = lazy(() => import("./Pages/Login"));
const Inscription = lazy(() => import("./Pages/Inscription"));
const Payment = lazy(() => import("./Pages/Payment"));
const PaymentSuccess = lazy(() => import("./Pages/PaymentSuccess"));
const Recherche = lazy(() => import("./Pages/Recherche"));
const PageNotFound = lazy(() => import("./Pages/PageNotFound"));

const AddProperty = lazy(() => import("./Pages/AddProperty"));
const LocationsVoituresManagement = lazy(() => import("./Pages/dashboards/admin/LocationsVoituresManagement"));
const AppartementsManagement = lazy(() => import("./Pages/dashboards/admin/AppartementsManagement"));
const HotelsManagement = lazy(() => import("./Pages/dashboards/admin/HotelsManagement"));
const VillasManagement = lazy(() => import("./Pages/dashboards/admin/VillasManagement"));

// Importations paresseuses des composants

const AppartementDetails = lazy(() => import("./Pages/services/AppartementDetails"));

const VillaDetails = lazy(() => import("./Pages/services/VillaDetails"));

const HotelDetails = lazy(() => import("./Pages/services/HotelDetails"));

const VoitureDetails = lazy(() => import("./Pages/services/VoitureDetails"));

const TourismeDetails = lazy(() => import("./Pages/services/TourismeDetails"));




// Sous-pages services
const Tourisme = lazy(() => import("./Pages/services/Tourisme"));
const Voitures = lazy(() => import("./Pages/services/Voitures"));
const Appartements = lazy(() => import("./Pages/services/Appartements"));
const Villas = lazy(() => import("./Pages/services/Villas"));
const Hotels = lazy(() => import("./Pages/services/Hotels"));
const Guides = lazy(() => import("./Pages/services/Guides"));
const Activites = lazy(() => import("./Pages/services/Activites"));
const Restaurants = lazy(() => import("./Pages/services/Restaurants"));
const RestaurantDetails = lazy(() => import("./Pages/services/RestaurantDetails"));
const ServiceReservation = lazy(() => import("./Pages/services/ServiceReservation"));
const Immobilier = lazy(() => import("./Pages/Immobilier"));

// Tableaux de bord
const AdminDashboard = lazy(() => import('./Pages/dashboards/AdminDashboard'));
const PartnerDashboard = lazy(() => import('./Pages/dashboards/partner/PartnerDashboard'));
const ClientDashboard = lazy(() => import('./Pages/dashboards/ClientDashboard'));

// Pages de gestion des propriétés (anciennes - gardées pour compatibilité)

const ServiceForm = lazy(() => import("./Pages/dashboards/admin/ServiceForm"));
const SiteSettingsPage = lazy(() => import("./Pages/dashboards/admin/SiteSettingsPage"));
const CommissionsPage = lazy(() => import("./Pages/dashboards/admin/CommissionsPage"));

// Pages partenaire
const PartnerEvents = lazy(() => import("./Pages/dashboards/partner/PartnerEvents"));
const PartnerAnnonces = lazy(() => import("./Pages/dashboards/partner/PartnerAnnonces"));
const PartnerProfile = lazy(() => import("./Pages/dashboards/partner/PartnerProfile"));
const PartnerSettings = lazy(() => import("./Pages/dashboards/partner/PartnerSettings"));
const PartnerProducts = lazy(() => import("./Pages/dashboards/partner/PartnerProducts"));
const ProductForm = lazy(() => import("./Pages/dashboards/partner/ProductForm"));

// Client Pages
const ClientProfile = lazy(() => import("./Pages/dashboards/client/ClientProfile").then(module => ({ default: module.default })));
const ClientSettings = lazy(() => import("./Pages/dashboards/client/ClientSettings").then(module => ({ default: module.default })));
const ClientBookings = lazy(() => import("./Pages/dashboards/client/ClientBookings").then(module => ({ default: module.default })));

// Admin Pages
const UsersManagement = lazy(() => import("./Pages/dashboards/admin/UsersManagement"));
const PartnersManagement = lazy(() => import("./Pages/dashboards/admin/PartnersManagement"));
const BookingsManagement = lazy(() => import("./Pages/dashboards/admin/BookingsManagement"));
const PaymentsManagement = lazy(() => import("./Pages/dashboards/admin/PaymentsManagement"));
const ServicesManagement = lazy(() => import("./Pages/dashboards/admin/ServicesManagement"));
const MessagesManagement = lazy(() => import("./Pages/dashboards/admin/MessagesManagement"));
const AdminSettings = lazy(() => import("./Pages/dashboards/admin/AdminSettings"));
const ImmobilierManagement = lazy(() => import("./Pages/dashboards/admin/ImmobilierManagement"));
const CircuitsTouristiquesManagement = lazy(() => import("./Pages/dashboards/admin/CircuitsTouristiquesManagement"));
const CircuitBookingsManagement = lazy(() => import("./Pages/dashboards/admin/CircuitBookingsManagement"));
const ActivitesManagement = lazy(() => import("./Pages/dashboards/admin/ActivitesTouristiquesManagement"));
const EvenementsManagement = lazy(() => import("./Pages/dashboards/admin/EvenementsManagement"));
const AnnoncesManagement = lazy(() => import("./Pages/dashboards/admin/AnnoncesManagement"));
const GuidesManagement = lazy(() => import("./Pages/dashboards/admin/GuidesTouristiquesManagement"));
const RestaurantsManagement = lazy(() => import("./Pages/dashboards/admin/RestaurantsManagement"));

// Composant de chargement pour le Suspense (inline spinner pour éviter la dépendance circulaire)
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" aria-hidden="true"></div>
  </div>
);

// Composant de mise en page publique
const PublicLayout = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);

  const handleBooking = (apartment: any) => {
    setSelectedApartment(apartment);
    setIsBookingOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="grow">
        <Outlet context={{ handleBooking }} />
      </main>
      <Footer />
      {isBookingOpen && selectedApartment && (
        <BookingForm 
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          service={{
            id: selectedApartment.id,
            title: selectedApartment.title,
            price: selectedApartment.price,
            images: selectedApartment.images || [],
            description: selectedApartment.description || ''
          }}
          serviceType="appartement"
        />
      )}
    </div>
  );
};

// Composant de mise en page pour l'authentification (sans navbar ni footer)
const AuthLayout = () => {
  // Vérifier si le mode maintenance est actif et si l'utilisateur a le mot de passe
  let bypassMaintenance = false;
  
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    bypassMaintenance = urlParams.get('maintenance') === MAINTENANCE_BYPASS_SECRET;
  }
  
  if (MAINTENANCE_MODE && !bypassMaintenance) {
    return <Maintenance />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

// Composant de page 404 personnalisée pour les tableaux de bord
const Dashboard404 = ({ role = 'admin' }: { role?: 'admin' | 'partner' | 'client' }) => {
  const basePath = `/dashboard/${role}`;
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-200 backdrop-blur-sm m-4 lg:m-8 min-h-[400px]">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Oups ! Page introuvable</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        La fonctionnalité ou la page que vous recherchez au sein du tableau de bord semble avoir pris des vacances sans nous prévenir.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => window.location.href = basePath}
          className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          Retour au tableau de bord
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
        >
          Page d'accueil
        </button>
      </div>
    </div>
  );
};


function App() {
  // Vérifier le mode maintenance
  if (MAINTENANCE_MODE && !checkMaintenanceBypass()) {
    // Si on est déjà sur la page de maintenance, on l'affiche
    if (typeof window !== 'undefined' && window.location.pathname === '/maintenance') {
      return (
        <ErrorBoundary>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Maintenance />
          </div>
        </ErrorBoundary>
      );
    }
    
    // Redirection côté client vers la page de maintenance
    if (typeof window !== 'undefined') {
      // Éviter la boucle de redirection
      if (window.location.pathname !== '/maintenance') {
        // Utiliser replaceState pour éviter d'ajouter à l'historique
        window.history.replaceState({}, '', '/maintenance');
        // Forcer le rechargement pour s'assurer que tout est propre
        window.location.reload();
      }
      
      // Afficher un spinner pendant la redirection
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <LoadingSpinner size="xl" />
        </div>
      );
    }
    
    // Fallback pour le rendu côté serveur
    return (
        <ErrorBoundary>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Maintenance />
          </div>
        </ErrorBoundary>
    );
  }

  return (
    <>
      <SEO />
      <AuthProvider>
        <SiteSettingsProvider>
          <SiteContentProvider>
            <div className="min-h-screen flex flex-col">
              <Suspense fallback={<LoadingFallback />}>
                <ErrorBoundary>
                  <Toaster position="top-center" />
                  <Routes>
                  {/* Route de maintenance - Doit être au niveau racine */}
                  <Route path="/maintenance" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <Maintenance />
                    </div>
                  } />
                  
                  {/* Routes d'authentification - Utilisation d'un layout sans navbar ni footer */}
                  <Route element={<AuthLayout />}>
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.SIGNUP} element={<Inscription />} />
                    <Route path={ROUTES.BECOME_HOST} element={<Navigate to={`${ROUTES.SIGNUP}?role=partner`} replace />} />
                  </Route>

                  {/* Routes publiques avec navbar et footer */}
                  <Route element={<PublicLayout />}>
                    <Route path={ROUTES.HOME} element={<Home onOpenBooking={() => {}} />} />
                    
                    {/* Routes des services - Utilisation des chemins simplifiés root-level */}
                    <Route path={ROUTES.SERVICES} element={<Services />} />

                    <Route path={ROUTES.APARTMENTS}>
                      <Route index element={<Appartements />} />
                      <Route path=":id" element={<AppartementDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.VILLAS}>
                      <Route index element={<Villas />} />
                      <Route path=":id" element={<VillaDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.HOTELS}>
                      <Route index element={<Hotels />} />
                      <Route path=":id" element={<HotelDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.CARS}>
                      <Route index element={<Voitures />} />
                      <Route path=":id" element={<VoitureDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.TOURISM}>
                      <Route index element={<Tourisme />} />
                      <Route path=":id" element={<TourismeDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.RESTAURANTS}>
                      <Route index element={<Restaurants />} />
                      <Route path=":id" element={<RestaurantDetails />} />
                      <Route path=":id/reserver" element={<ServiceReservation />} />
                    </Route>

                    <Route path={ROUTES.GUIDES} element={<Guides />} />
                    <Route path={ROUTES.ACTIVITIES} element={<Activites />} />
                    <Route path={ROUTES.EVENTS} element={<Evenements />} />
                  
                  {/* Autres pages publiques */}
                  <Route path={ROUTES.REAL_ESTATE} element={<Immobilier />} />
                  <Route path={ROUTES.ANNOUNCEMENTS} element={<Annonces />} />
                  <Route path={ROUTES.ABOUT} element={<Apropos />} />
                  <Route path={ROUTES.CONTACT} element={<Contact />} />
                  <Route path={ROUTES.SEARCH} element={<Recherche />} />
                  
                  <Route path="/ajouter-propriete" element={<AddProperty />} />

                  {/* Routes de paiement */}
                  <Route path=":type/:id/reserver" element={<ServiceReservation />} />
                  <Route path={ROUTES.PAYMENT} element={<Payment />} />
                  <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccess />} />
                </Route>

                {/* Tableau de bord administrateur */}
                <Route path={ROUTES.ADMIN.DASHBOARD} element={
                  <ErrorBoundary fallback={<div className="p-4 text-red-600">Erreur lors du chargement du tableau de bord administrateur</div>}>
                    <RoleGuard allowedRoles={['admin']}>
                      <DashboardLayout role="admin">
                        <Outlet />
                      </DashboardLayout>
                    </RoleGuard>
                  </ErrorBoundary>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="partners" element={<PartnersManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="payments" element={<PaymentsManagement />} />
                  <Route path="services">
                    <Route index element={<ServicesManagement />} />
                    <Route path=":id/edit" element={<ServiceForm />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Route>
                  
                  
                  {/* Routes pour la création de services spécifiques */}
                  {/* Gestion des services */}
                  <Route path="parametres" element={
                    <ErrorBoundary fallback={<div className="p-4 text-red-600">Erreur lors du chargement des paramètres du site</div>}>
                      <SiteSettingsPage />
                    </ErrorBoundary>
                  } />
                  <Route path="voitures">
                    <Route index element={<LocationsVoituresManagement />} />
                    <Route path="new" element={<LocationsVoituresManagement />} />
                    <Route path=":id/edit" element={<LocationsVoituresManagement />} />
                  </Route>
                  <Route path="villas">
                    <Route index element={<VillasManagement />} />
                    <Route path="new" element={<VillasManagement />} />
                    <Route path=":id/edit" element={<VillasManagement />} />
                  </Route>
                  <Route path="appartements">
                    <Route index element={<AppartementsManagement />} />
                    <Route path="new" element={<AppartementsManagement />} />
                    <Route path=":id/edit" element={<AppartementsManagement />} />
                  </Route>
                  <Route path="hotels">
                    <Route index element={<HotelsManagement />} />
                    <Route path="new" element={<HotelsManagement />} />
                    <Route path=":id/edit" element={<HotelsManagement />} />
                  </Route>
                  <Route path="circuits">
                    <Route index element={<CircuitsTouristiquesManagement />} />
                    <Route path="new" element={<CircuitsTouristiquesManagement />} />
                    <Route path=":id/edit" element={<CircuitsTouristiquesManagement />} />
                    <Route path=":id/reservations" element={<CircuitBookingsManagement />} />
                  </Route>
                  <Route path="evenements">
                    <Route index element={<EvenementsManagement />} />
                    <Route path="new" element={<EvenementsManagement />} />
                    <Route path=":id/edit" element={<EvenementsManagement />} />
                  </Route>
                  <Route path="annonces">
                    <Route index element={<AnnoncesManagement />} />
                    <Route path="new" element={<AnnoncesManagement />} />
                    <Route path=":id/edit" element={<AnnoncesManagement />} />
                  </Route>
                  <Route path="immobilier" element={<ImmobilierManagement />} />
                  <Route path="commissions" element={
                    <ErrorBoundary fallback={<div className="p-4 text-red-600">Erreur lors du chargement des commissions</div>}>
                      <CommissionsPage />
                    </ErrorBoundary>
                  } />
                  <Route path="guides" element={<GuidesManagement />} />
                  <Route path="activites" element={<ActivitesManagement />} />
                  <Route path="restaurants" element={<RestaurantsManagement />} />
                  <Route path="messages" element={<MessagesManagement />} />
                  <Route path="parametres" element={<AdminSettings />} />
                  
                  {/* Page 404 pour l'admin */}
                  <Route path="*" element={<Dashboard404 role="admin" />} />
                </Route>

                {/* Tableau de bord partenaire */}
                <Route path={ROUTES.PARTNER.DASHBOARD} element={
                  <RoleGuard allowedRoles={['partner', 'admin']}>
                    <DashboardLayout role="partner">
                      <Outlet />
                    </DashboardLayout>
                  </RoleGuard>
                }>
                  <Route index element={<PartnerDashboard />} />
                  <Route path="products" element={<PartnerProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="evenements" element={<PartnerEvents />} />
                  <Route path="annonces" element={<PartnerAnnonces />} />
                  <Route path="profil" element={<PartnerProfile />} />
                  <Route path="parametres" element={<PartnerSettings />} />
                  
                  {/* Page 404 pour le partenaire */}
                  <Route path="*" element={<Dashboard404 role="partner" />} />
                </Route>
                
                {/* Tableau de bord client */}
                <Route path="dashboard/client" element={
                  <RoleGuard allowedRoles={['client', 'partner', 'admin']}>
                    <ErrorBoundary fallback={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center p-6 bg-white rounded-lg shadow-md">
                          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
                          <p className="mb-4">Une erreur est survenue lors du chargement du tableau de bord client.</p>
                          <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Réessayer
                          </button>
                        </div>
                      </div>
                    }>
                      <ClientPageLayout>
                        <Outlet />
                      </ClientPageLayout>
                    </ErrorBoundary>
                  </RoleGuard>
                }>
                  <Route index element={<ClientDashboard />} />
                  <Route path="profil" element={<ClientProfile />} />
                  <Route path="parametres" element={<ClientSettings />} />
                  <Route path="reservations" element={<ClientBookings />} />
                  <Route path="*" element={<Dashboard404 role="client" />} />
                </Route>

                {/* Redirection des anciennes URLs */}
                <Route path="/dashboard" element={<Navigate to={ROUTES.HOME} replace />} />
                <Route path="/admin" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
                <Route path="/partner" element={<Navigate to={ROUTES.PARTNER.DASHBOARD} replace />} />
                <Route path="/client" element={<Navigate to={ROUTES.CLIENT.DASHBOARD} replace />} />

                {/* Page 404 globale */}
                <Route path="*" element={<PageNotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </div>
        </SiteContentProvider>
      </SiteSettingsProvider>
    </AuthProvider>
    </>
  );
}

export default App;
