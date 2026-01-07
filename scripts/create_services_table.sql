-- Crée extension pour gen_random_uuid si nécessaire
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table centralisée "services" pour tous types : appartement, villa, hotel, car, tour, evenement, annonce
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price_per_night numeric,
  type text, -- 'apartment' | 'villa' | 'hotel' | 'car' | 'tour' | 'event' | 'annonce'
  city text,
  region text,
  address text,
  rooms integer,
  amenities jsonb DEFAULT '[]'::jsonb,
  images text[] DEFAULT '{}',
  available boolean DEFAULT true,
  featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Policy permissive DEV ONLY (autorise SELECT/INSERT/UPDATE/DELETE pour debug)
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_allow_all ON public.services;
CREATE POLICY dev_allow_all ON public.services FOR ALL USING (true) WITH CHECK (true);