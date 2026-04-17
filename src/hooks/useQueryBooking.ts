import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface BookingData {
  service_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  guests: number;
  service_type: string;
}

interface MutationContext {
  previousBookings: any;
}

export const useQueryBooking = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, BookingData, MutationContext>({
    mutationFn: async (bookingData: BookingData) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newBooking) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previousBookings = queryClient.getQueryData(['bookings']);
      
      queryClient.setQueryData(['bookings'], (old: any[] = []) => [
        ...old,
        { ...newBooking, id: 'temp-id-' + Date.now(), created_at: new Date().toISOString() },
      ]);

      return { previousBookings };
    },
    onError: (_err, _newBooking, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['bookings'], context.previousBookings);
      }
      toast.error('Erreur lors de la réservation. Veuillez réessayer.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: () => {
      toast.success('Réservation effectuée avec succès !');
    },
  });
};
