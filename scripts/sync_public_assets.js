/**
 * Usage:
 * 1) installer deps: npm i @supabase/supabase-js dotenv
 * 2) ajouter SUPABASE_SERVICE_ROLE dans .env.local
 * 3) node ./scripts/sync_public_assets.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquante dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// mapping dossiers -> type
const mappings = [
  { folder: 'APT', type: 'apartment' },
  { folder: 'HOTELS', type: 'hotel' },
  { folder: 'VILLAS', type: 'villa' },
  { folder: 'CARS', type: 'car' },
  { folder: 'TOURS', type: 'tour' },
  { folder: 'EVENTS', type: 'event' },
  // ajoute d'autres mappings si nécessaire
];

function collectImages(dir) {
  const imgs = [];
  if (!fs.existsSync(dir)) return imgs;
  const walk = (d) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && /\.(jpe?g|png|webp|gif|svg)$/i.test(e.name)) {
        // chemin public : enlever le préfixe projectRoot/public
        const rel = full.replace(path.join(projectRoot, 'public'), '').replace(/\\/g, '/');
        imgs.push(rel.startsWith('/') ? rel : '/' + rel);
      }
    }
  };
  walk(dir);
  return imgs;
}

(async () => {
  try {
    for (const m of mappings) {
      const base = path.join(publicDir, m.folder);
      if (!fs.existsSync(base)) {
        console.log('Dossier introuvable, skip :', base);
        continue;
      }

      // si structure: public/APT/assets/<VILLE>/<APPART>/* -> parcourir villes puis apparts
      const level1 = fs.readdirSync(base, { withFileTypes: true });
      for (const l1 of level1) {
        if (!l1.isDirectory()) continue;
        const cityDir = path.join(base, l1.name); // ex: public/APT/assets/agadir or public/APT/agadir
        // descend d'un niveau pour trouver listings (si assets sous city)
        const maybeAssets = path.join(cityDir, 'assets');
        let listingsDirs = [];
        if (fs.existsSync(maybeAssets)) {
          // assets/<listing>...
          listingsDirs = fs.readdirSync(maybeAssets, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(maybeAssets, d.name));
        } else {
          // soit cityDir contient directement listing dossiers ou images
          const entries = fs.readdirSync(cityDir, { withFileTypes: true });
          const hasDirs = entries.some(e => e.isDirectory());
          if (hasDirs) {
            listingsDirs = entries.filter(e => e.isDirectory()).map(d => path.join(cityDir, d.name));
          } else {
            // cityDir itself is a listing (images inside)
            listingsDirs = [cityDir];
          }
        }

        for (const listingPath of listingsDirs) {
          const images = collectImages(listingPath);
          if (!images.length) continue;

          const listingName = path.basename(listingPath).replace(/[_\-]/g, ' ');
          const title = `${listingName} — ${l1.name}`; // ex: appart2 — agadir
          const city = l1.name;
          const type = m.type;
          const description = `Auto-importé: ${type} ${title}`;
          const price = Math.floor(200 + Math.random() * 800);

          // check exists by title+city+type
          const { data: exists } = await supabase
            .from('services')
            .select('id')
            .eq('title', title)
            .eq('city', city)
            .eq('type', type)
            .limit(1);

          if (exists && exists.length) {
            console.log('Existant, skip:', title, city, type);
            continue;
          }

          const payload = {
            title,
            description,
            price_per_night: price,
            type,
            city,
            images,
            available: true,
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('services')
            .insert([payload]);

          if (error) {
            console.error('Erreur insert', title, error);
          } else {
            console.log('Inséré:', title, 'images:', images.length);
          }
        }
      }
    }

    console.log('Sync terminé.');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
})();