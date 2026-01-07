// src/types/auth.d.ts
export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'partner' | 'client';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  country: string;
  address?: string;
  city?: string;
  avatar_url?: string;
  description?: string;
  company_name?: string;
  partner_type?: string;
  // Supprimer ou ajouter des champs selon votre schéma
  // commission_rate?: number;  // Supprimer si la colonne n'existe pas
  bank_account?: string;
  iban?: string;
  total_earnings?: number;
  pending_earnings?: number;
  paid_earnings?: number;
}