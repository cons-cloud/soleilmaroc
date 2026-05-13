import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const buckets = [
  'services_marocsoleil',
  'profiles_marocsoleil',
  'site_assets_marocsoleil',
  'evenements_marocsoleil',
  'annonces_marocsoleil',
  'restaurants_marocsoleil'
];

async function setupStorage() {
  console.log('--- STORAGE SETUP ---');
  for (const bucketName of buckets) {
    console.log(`Checking bucket: ${bucketName}...`);
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
    
    if (getError && getError.message.includes('not found')) {
      console.log(`  Creating bucket ${bucketName}...`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) {
        console.error(`  ❌ Error creating ${bucketName}:`, error.message);
      } else {
        console.log(`  ✅ Successfully created ${bucketName}`);
      }
    } else if (getError) {
      console.error(`  ⚠️ Error checking ${bucketName}:`, getError.message);
    } else {
      console.log(`  ✅ Already exists (Public: ${bucket.public})`);
      if (!bucket.public) {
        console.log(`  Updating ${bucketName} to public...`);
        await supabase.storage.updateBucket(bucketName, { public: true });
      }
    }
  }
}

setupStorage();
