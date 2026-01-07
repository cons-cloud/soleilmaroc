export interface Apartment {
  id: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  type: string;
  price_per_night: number;
  price_sale?: number;
  for_rent: boolean;
  for_sale: boolean;
  bedrooms: number;
  bathrooms: number;
 
  floor?: number;
  city: string;
  region?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  available: boolean;
  featured: boolean;
  contact_phone: string;
  
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApartmentFormData {
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  type: string;
  price_per_night: string | number;
  price_sale?: string | number;
  for_rent: boolean;
  for_sale: boolean;
  bedrooms: string | number;
  bathrooms: string | number;
  surface_area: string | number;
  floor?: string | number;
  city: string;
  region?: string;
  address: string;
  latitude?: string | number;
  longitude?: string | number;
  images: string[];
  amenities: string[];
  available: boolean;
  featured: boolean;
  contact_phone: string;
  contact_email?: string;
}