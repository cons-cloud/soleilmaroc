export interface CarRental {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  price_per_day: number;
  available: boolean;
  featured: boolean;
  images: string[];
  description: string;
  description_ar?: string;
  features: string[];
  city: string;
  region?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  contact_email?: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CarRentalFormData {
  make: string;
  model: string;
  year: string | number;
  type: string;
  transmission: string;
  fuel_type: string;
  seats: string | number;
  price_per_day: string | number;
  available: boolean;
  featured: boolean;
  images: string[];
  description: string;
  description_ar?: string;
  features: string[];
  city: string;
  region?: string;
  address: string;
  latitude?: string | number;
  longitude?: string | number;
  contact_phone: string;
  contact_email?: string;
}