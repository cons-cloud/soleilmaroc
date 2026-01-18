-- ============================================
-- CRÉER LA TABLE ACTIVITES_TOURISTIQUES
-- À exécuter dans Supabase SQL Editor si la table n'existe pas
-- ============================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.activites_touristiques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  activity_type VARCHAR(50), -- excursion, sport, culture, aventure
  duration_hours DECIMAL(4,2),
  price_per_person DECIMAL(10,2) NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  images TEXT[],
  includes JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb, -- âge minimum, condition physique
  max_participants INTEGER,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_activites_city ON activites_touristiques(city);
CREATE INDEX IF NOT EXISTS idx_activites_activity_type ON activites_touristiques(activity_type);
CREATE INDEX IF NOT EXISTS idx_activites_available ON activites_touristiques(available);
CREATE INDEX IF NOT EXISTS idx_activites_partner_id ON activites_touristiques(partner_id);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activites_touristiques_updated_at ON activites_touristiques;
CREATE TRIGGER update_activites_touristiques_updated_at
BEFORE UPDATE ON activites_touristiques
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE activites_touristiques ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Enable read access for all users" ON activites_touristiques;
DROP POLICY IF EXISTS "Admins can manage all activites" ON activites_touristiques;
DROP POLICY IF EXISTS "Partners can manage own activites" ON activites_touristiques;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON activites_touristiques FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admins can manage all activites"
ON activites_touristiques FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partenaires peuvent gérer leurs activités
CREATE POLICY "Partners can manage own activites"
ON activites_touristiques FOR ALL
TO authenticated
USING (
  auth.uid() = partner_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
)
WITH CHECK (
  auth.uid() = partner_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
);

-- Vérification
SELECT 
    'activites_touristiques' as table_name,
    COUNT(*) as row_count
FROM activites_touristiques;

