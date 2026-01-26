import { createClient, SupabaseClient } from '@supabase/supabase-js';

let viteEnv: any = undefined;
try {
  // @ts-ignore
  viteEnv = (import.meta as any).env;
} catch (_) {
  viteEnv = undefined;
}

const SUPABASE_URL =
  viteEnv?.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  viteEnv?.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  '';

const mask = (s: any) => {
  if (!s) return '<missing>';
  const str = String(s);
  if (str.length <= 8) return '****';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
};

let _supabase: SupabaseClient | any;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase env check failed. Details:');
  console.error('import.meta.env present:', !!viteEnv);
  console.error('import.meta.env.VITE_SUPABASE_URL:', mask(viteEnv?.VITE_SUPABASE_URL));
  console.error('import.meta.env.VITE_SUPABASE_ANON_KEY:', mask(viteEnv?.VITE_SUPABASE_ANON_KEY));
  console.error('process.env.VITE_SUPABASE_URL:', mask(process.env.VITE_SUPABASE_URL));
  console.error('process.env.VITE_SUPABASE_ANON_KEY:', mask(process.env.VITE_SUPABASE_ANON_KEY));
  console.error('Action: mettre VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env à la racine, puis REDÉMARRER le serveur dev (npm run dev).');

  // stub client to avoid build/runtime crashes in dev when env not present
  _supabase = {
    from: () => ({
      select: async () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    rpc: async () => ({ data: null, error: new Error('Supabase not configured') }),
    auth: {
      getUser: async () => ({ data: null, error: new Error('Supabase not configured') }),
    },
  } as any;
} else {
  try {
    // validate URL
    // eslint-disable-next-line no-new
    new URL(SUPABASE_URL);
  } catch {
    console.error('Invalid SUPABASE_URL:', SUPABASE_URL);
    throw new Error('Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.');
  }

  _supabase = createClient(String(SUPABASE_URL), String(SUPABASE_ANON_KEY));
}

export const supabase = _supabase as SupabaseClient;

export type UserRole = 'admin' | 'partner_tourism' | 'partner_car' | 'partner_realestate' | 'client';
export type PropertyType = 'apartment' | 'villa' | 'hotel' | 'car' | 'tour';
export interface Profile { [key: string]: any }
export interface Property { [key: string]: any }