import { Database } from './database.types';

// =============================================
// Types utilitaires
// =============================================
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// =============================================
// Types de base
// =============================================

export type ServiceStatus = 'draft' | 'published' | 'archived';

export type ServiceType = 
  | 'hotel' 
  | 'restaurant' 
  | 'activity' 
  | 'transport' 
  | 'guide' 
  | 'evenement' 
  | 'activite' 
  | 'appartement' 
  | 'villa' 
  | 'voiture';

// =============================================
// Interfaces principales
// =============================================

export interface Profile extends Tables<'profiles'> {
  // Propriétés étendues du profil
  services?: Service[];
  ratings?: number;
}

export interface Service extends Omit<Tables<'services'>, 'description' | 'category'> {
  // Propriétés de base
  type: ServiceType;
  status: ServiceStatus;
  
  // Métadonnées
  rating?: number;
  reviews_count?: number;
  
  // Relations
  partner?: Profile;
  
  // Autres propriétés
  name: string;
  images: string[];
  price: number;
  location: string;
  category: string;
  description?: string;
  
  // Propriétés optionnelles
  available?: boolean;
  capacity?: number;
  duration?: number;
  features?: string[];
  rules?: string[];
  cancellation_policy?: string;
  
  // Localisation
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  
  // Contact
  phone?: string;
  email?: string;
  website?: string;
  
  // Métadonnées SEO
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  
  // Statistiques
  views_count?: number;
  favorites_count?: number;
  bookings_count?: number;
  average_rating?: number;
  
  // Catégories et tags
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  
  // Disponibilité
  start_date?: string;
  end_date?: string;
  time_slots?: TimeSlot[];
  availability?: Availability;
  
  // Options de tarification
  pricing_options?: PricingOption[];
  
  // FAQ et avis
  faqs?: FAQ[];
  reviews?: Review[];
}

export interface Booking extends Tables<'bookings'> {
  service?: Service;
  user?: Profile;
}

// =============================================
// Types d'insertion
// =============================================

export type ProfileInsert = TablesInsert<'profiles'>;

export interface ServiceInsert extends Omit<TablesInsert<'services'>, 'status' | 'type'> {
  type: ServiceType;
  status?: ServiceStatus;
  // Autres propriétés optionnelles pour l'insertion
}

export type BookingInsert = TablesInsert<'bookings'>;

// =============================================
// Types de mise à jour
// =============================================

export type ProfileUpdate = TablesUpdate<'profiles'>;

export interface ServiceUpdate extends Omit<TablesUpdate<'services'>, 'status' | 'type'> {
  type?: ServiceType;
  status?: ServiceStatus;
  // Autres propriétés optionnelles pour la mise à jour
}

export type BookingUpdate = TablesUpdate<'bookings'>;

// =============================================
// Types utilitaires étendus
// =============================================

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Availability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface PricingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  is_popular?: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// =============================================
// Types pour les formulaires
// =============================================

export interface PartnerFormData {
  company_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  bank_account?: string;
  iban?: string;
}

// =============================================
// Autres types
// =============================================

export type Partner = Profile & {
  services?: Service[];
  ratings?: number;
};

export interface ServiceWithPartner extends Service {
  partner?: Profile;
}

export interface BookingWithService extends Booking {
  service?: Service;
}

export interface BookingWithRelations extends Booking {
  service?: Service;
  user?: Profile;
}

// Alias pour la rétrocompatibilité
export type { Service as ServiceBase };
