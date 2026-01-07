export interface Tour {
  id: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  duration_days: number;
  price_per_person: number;
  max_participants: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  start_location: string;
  end_location: string;
  includes: string[];
  not_included: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  images: string[];
  available: boolean;
  featured: boolean;
  city: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  contact_email?: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TourFormData {
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  duration_days: string | number;
  price_per_person: string | number;
  max_participants: string | number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  start_location: string;
  end_location: string;
  includes: string[];
  not_included: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  images: string[];
  available: boolean;
  featured: boolean;
  city: string;
  region?: string;
  latitude?: string | number;
  longitude?: string | number;
  contact_phone: string;
  contact_email?: string;
}