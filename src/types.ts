export interface PartnerStats {
  total_products: number;
  active_products: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  average_rating: number;
}

export interface Product {
  id: string;
  title: string;
  product_type: string;
  price: number;
  city: string;
  available: boolean;
  views: number;
  bookings_count: number;
  rating: number;
  main_image: string;
  created_at: string;
}

export interface Booking {
  id: string;
  service_title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_date: string | null;
  end_date: string | null;
  amount: number;
  payment_status: string;
  booking_status: string;
  partner_paid: boolean;
  partner_paid_at: string | null;
  created_at: string;
  earning_status: string;
}

export interface SearchOptions {
  table?: string;
  fields?: string[];
  onlyAvailable?: boolean;
  partnerId?: string | number | undefined;
}