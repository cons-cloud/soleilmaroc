import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_* env variables — supabase client not initialized');
}

let _supabase: SupabaseClient | any = null;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Minimal stub to avoid crashes in dev when env missing
  _supabase = {
    from: (_tableName: string) => ({
      select: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      order: function() { return this; },
      eq: function() { return this; },
      limit: function() { return this; },
    }),
    auth: {
      signIn: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      getSession: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    },
    storage: {
      from: () => ({ upload: async () => ({ error: { message: 'Supabase not configured' } }) }),
    },
  } as any;
}

export const supabase: SupabaseClient | any = _supabase;

// Types principaux
export type UserRole = 'admin' | 'partner_tourism' | 'partner_car' | 'partner_realestate' | 'client';
export type PropertyType = 'apartment' | 'villa' | 'hotel' | 'car' | 'tour';
export interface Profile { [key: string]: any }
export interface Property { [key: string]: any }