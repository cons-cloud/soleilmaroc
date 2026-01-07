// src/contexts/ReservationContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface ReservationState {
  propertyId: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  step: number;
  // Ajoutez d'autres champs nécessaires
}

interface ReservationContextType {
  reservation: ReservationState;
  startReservation: (propertyId: string) => void;
  updateReservation: (updates: Partial<ReservationState>) => void;
  clearReservation: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reservation, setReservation] = useState<ReservationState>({
    propertyId: null,
    checkIn: null,
    checkOut: null,
    guests: 1,
    step: 0,
  });

  const startReservation = (propertyId: string) => {
    setReservation(prev => ({
      ...prev,
      propertyId,
      step: 1, // Premier pas du formulaire
    }));
  };

  const updateReservation = (updates: Partial<ReservationState>) => {
    setReservation(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const clearReservation = () => {
    setReservation({
      propertyId: null,
      checkIn: null,
      checkOut: null,
      guests: 1,
      step: 0,
    });
  };

  return (
    <ReservationContext.Provider
      value={{
        reservation,
        startReservation,
        updateReservation,
        clearReservation,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};