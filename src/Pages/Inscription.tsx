import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePhoneMaroc as validatePhone } from '../utils/validation';
import { Loader2, Eye, EyeOff, Check } from 'lucide-react';
import LegalModal from '../components/LegalModal';
import { ROUTES } from '../config/routes';

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const Inscription = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [legalModalType, setLegalModalType] = useState<'mentions' | 'confidentialite' | 'cgv' | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    if (formData.telephone && !validatePhone(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.terms) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const pendingReservation = sessionStorage.getItem('pendingReservation');
      
      const profileData = {
        first_name: formData.prenom.trim(),
        last_name: formData.nom.trim(),
        phone: formData.telephone.trim() || undefined,
        role: 'client' as const,
        is_verified: false,
        country: 'Maroc'
      };
      
      await signUp(
        formData.email.trim(), 
        formData.password,
        profileData
      );
      
      // Attendre un peu pour que le profil soit bien chargé dans le contexte
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (pendingReservation) {
        try {
          const pending = JSON.parse(pendingReservation);
          const serviceType = pending.serviceType || 'service';
          const serviceId = pending.serviceId;
          
          let reservationPath = null;
          switch (serviceType) {
            case 'appartement':
            case 'apartment':
            case 'appartements':
              reservationPath = `/appartements/${serviceId}/reserver`;
              break;
            case 'villa':
            case 'villas':
              reservationPath = `/villas/${serviceId}/reserver`;
              break;
            case 'voiture':
            case 'car':
            case 'voitures':
            case 'cars':
              reservationPath = `/voitures/${serviceId}/reserver`;
              break;
            case 'circuit':
            case 'tourism':
            case 'tour':
            case 'circuits':
              reservationPath = `/tourisme/${serviceId}/reserver`;
              break;
            case 'hotel':
            case 'hotels':
              reservationPath = `/hotels/${serviceId}/reserver`;
              break;
            default:
              reservationPath = `/${serviceType}/${serviceId}/reserver`;
          }
          
          if (reservationPath) {
            toast.success('Compte créé avec succès ! Redirection vers votre réservation...', {
              duration: 4000,
            });
            navigate(reservationPath, {
              state: {
                fromSignup: true,
                fromLogin: true,
                formData: pending.formData,
                serviceId: pending.serviceId,
                serviceType: pending.serviceType
              }
            });
            return;
          }
        } catch (e) {
          console.error('Erreur lors de la restauration de la réservation après inscription:', e);
          sessionStorage.removeItem('pendingReservation');
        }
      }
      
      toast.success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.', {
        duration: 6000,
      });
      
      navigate(ROUTES.CLIENT.DASHBOARD);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message?.includes('email') 
        ? 'Cette adresse email est déjà utilisée'
        : 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormErrors) => 
    `block w-full px-4 py-2 rounded-lg border ${
      errors[field] 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
    } shadow-sm sm:text-sm`;

  const errorClass = (field: keyof FormErrors) => 
    `mt-1 text-sm ${errors[field] ? 'text-red-600' : 'text-gray-500'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <Link 
          to="/"
          className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors mb-6 group"
          aria-label="Retour à l'accueil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </Link>

        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Déjà inscrit ?{' '}
            <Link 
              to="/login" 
              className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:underline"
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-lg sm:rounded-xl">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, prenom: true})}
                  className={inputClass('prenom')}
                  aria-invalid={!!errors.prenom}
                  aria-describedby={errors.prenom ? 'prenom-error' : undefined}
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-600" id="prenom-error">
                    {errors.prenom}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, nom: true})}
                  className={inputClass('nom')}
                  aria-invalid={!!errors.nom}
                  aria-describedby={errors.nom ? 'nom-error' : undefined}
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-600" id="nom-error">
                    {errors.nom}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, email: true})}
                  className={`${inputClass('email')} ${formData.email && !errors.email && validateEmail(formData.email) ? 'pr-10' : ''}`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {formData.email && !errors.email && validateEmail(formData.email) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <p className={errorClass('email')} id="email-error">
                {errors.email || 'Exemple : exemple@domaine.com'}
              </p>
            </div>

            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <div className="relative">
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, telephone: true})}
                  placeholder="+212 6 12 34 56 78"
                  className={`${inputClass('telephone')} ${formData.telephone && !errors.telephone && validatePhone(formData.telephone) ? 'pr-10' : ''}`}
                  aria-invalid={!!errors.telephone}
                  aria-describedby={errors.telephone ? 'telephone-error' : undefined}
                />
                {formData.telephone && !errors.telephone && validatePhone(formData.telephone) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <p className={errorClass('telephone')} id="telephone-error">
                {errors.telephone || 'Format : +212 6 12 34 56 78'}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, password: true})}
                  className={`${inputClass('password')} pr-10`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              <div id="password-help" className={errorClass('password')}>
                {errors.password || (
                  <span className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Minimum 8 caractères, une majuscule et un chiffre</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => setTouched({...touched, confirmPassword: true})}
                  className={`${inputClass('confirmPassword')} pr-10`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600" id="confirm-password-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={formData.terms}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  aria-invalid={!!errors.terms}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  J'accepte les{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalModalType('cgv');
                    }}
                    className="text-emerald-600 hover:text-emerald-500 hover:underline"
                  >
                    conditions d'utilisation
                  </button>{' '}
                  et la{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalModalType('confidentialite');
                    }}
                    className="text-emerald-600 hover:text-emerald-500 hover:underline"
                  >
                    politique de confidentialité
                  </button>{' '}
                  <span className="text-red-500">*</span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600" id="terms-error">
                    {errors.terms}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Inscription en cours...
                  </>
                ) : 'Créer mon compte'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Modal légal */}
      {legalModalType && (
        <LegalModal 
          isOpen={true}
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}
    </div>
  );
};

export default Inscription;