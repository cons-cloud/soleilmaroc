/**
 * Utilitaire pour accéder aux variables d'environnement avec des valeurs par défaut
 * et une validation optionnelle.
 */

/**
 * Récupère une variable d'environnement avec une valeur par défaut optionnelle
 * @param key - Le nom de la variable d'environnement
 * @param defaultValue - Valeur par défaut si la variable n'est pas définie
 * @returns La valeur de la variable d'environnement ou la valeur par défaut
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] ?? process.env[key] ?? defaultValue;
  
  if (value === undefined) {
    console.warn(`⚠️ La variable d'environnement ${key} n'est pas définie`);
  }
  
  return value ?? '';
}

/**
 * Récupère une variable d'environnement requise
 * @param key - Le nom de la variable d'environnement
 * @returns La valeur de la variable d'environnement
 * @throws {Error} Si la variable n'est pas définie
 */
export function requireEnv(key: string): string {
  const value = getEnv(key);
  
  if (!value) {
    throw new Error(`La variable d'environnement requise ${key} n'est pas définie`);
  }
  
  return value;
}

// Variables d'environnement courantes
// Variables d'environnement courantes
// Variables d'environnement courantes
export const env = {
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: import.meta.env.VITE_JWT_SECRET || '',
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  stripeSecretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Environnement Vite
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Exporte un objet avec toutes les variables d'environnement
export default env;