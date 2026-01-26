import { supabase } from './supabase';

export async function createBooking(opts: {
  productId: string;
  start: string; // ISO string
  end: string;   // ISO string
  name: string;
  email: string;
  phone?: string;
  amount?: number;
}) {
  const { productId, start, end, name, email, phone, amount = 0 } = opts;
  // use RPC that sets partner_id and client_id server-side
  const { data, error } = await supabase.rpc('create_booking', {
    p_product_id: productId,
    p_start: start,
    p_end: end,
    p_client_name: name,
    p_client_email: email,
    p_client_phone: phone || '',
    p_amount: amount
  });
  return { data, error };
}

export async function fetchPartnerBookings() {
  const { data, error } = await supabase
    .from('partner_bookings_view')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}