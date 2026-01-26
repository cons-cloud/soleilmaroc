import React, { useEffect, useState } from 'react';
import { fetchPartnerBookings } from '../../../lib/bookings';
import { useAuth } from '../../../contexts/AuthContext';

const BookingsList: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data, error } = await fetchPartnerBookings();
      if (error) {
        console.error('fetchPartnerBookings error', error);
        return;
      }
      // optionally filter by partner_id === user.id
      setBookings((data || []).filter((b: any) => b.partner_id === user?.id));
    };
    load();
  }, [user?.id]);
  return (
    <div>
      <h2>Réservations</h2>
      {bookings.map(b => (
        <div key={b.id} className="p-3 border-b">
          <div>{b.product_title} — {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}</div>
          <div>Client: {b.client_name} ({b.client_email})</div>
          <div>Montant: {b.amount} {b.currency || 'MAD'}</div>
          <div>Statut: {b.booking_status} / {b.payment_status}</div>
        </div>
      ))}
    </div>
  );
};

export default BookingsList;