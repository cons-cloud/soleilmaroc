export interface Hotel {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  city: string;
  region?: string;
  address: string;
  stars: number;
  amenities: string[];
  contact_phone: string;  // Gardez uniquement contact_phone
  available: boolean;
  featured: boolean;
  images: string[];
  rooms_count?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}