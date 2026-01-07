import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Hotel } from '../types/hotel';

export const useCreateHotel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHotel = async (hotelData: Partial<Hotel> & { 
    name: string; 
    price_per_night: number | string;
    stars: number | string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const hotelToInsert: Omit<Hotel, 'id' | 'created_at' | 'updated_at'> = {
        name: hotelData.name || '',
        description: hotelData.description || '',
        price_per_night: Number(hotelData.price_per_night) || 0,
        city: hotelData.city || '',
        region: hotelData.region,
        address: hotelData.address || '',
        stars: Number(hotelData.stars) || 3,
        amenities: Array.isArray(hotelData.amenities) ? hotelData.amenities : [],
        contact_phone: hotelData.contact_phone || '',
        available: Boolean(hotelData.available),
        featured: Boolean(hotelData.featured),
        images: Array.isArray(hotelData.images) ? hotelData.images : [],
        rooms_count: Number(hotelData.rooms_count) || 1,
        user_id: user.id
      };

      const { data, error: insertError } = await supabase
        .from('hotels')
        .insert(hotelToInsert)
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createHotel, loading, error };
};