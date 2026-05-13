import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'site_settings_marocsoleil',
  'site_content_marocsoleil',
  'profiles_marocsoleil',
  'categories_marocsoleil',
  'partner_products_marocsoleil',
  'bookings_marocsoleil',
  'payments_marocsoleil',
  'notifications_marocsoleil',
  'comments_marocsoleil',
  'wishlist_marocsoleil',
  'coupons_marocsoleil',
  'settings_marocsoleil',
  'contacts_marocsoleil',
  'services_marocsoleil',
  'evenements_marocsoleil',
  'annonces_marocsoleil',
  'activites_marocsoleil',
  'restaurants_marocsoleil',
  'guides_touristiques_marocsoleil',
  'immobilier_marocsoleil',
  'event_registrations_marocsoleil'
];

async function checkTables() {
  console.log('--- SCHEMA AUDIT ---');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table ${table} NOT FOUND`);
        } else {
          console.log(`⚠️ Table ${table} ERROR: ${error.message}`);
        }
      } else {
        console.log(`✅ Table ${table} EXISTS (${data?.length || 0} rows sample)`);
      }
    } catch (e) {
      console.log(`💥 Table ${table} CRITICAL ERROR: ${e.message}`);
    }
  }
}

checkTables();
