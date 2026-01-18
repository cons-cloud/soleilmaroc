-- ============================================
-- FIX RLS POUR ACCÈS ADMIN COMPLET
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script corrige les politiques RLS pour permettre l'accès complet
-- aux admins pour les tables: bookings, activites_touristiques, evenements, annonces

-- ============================================
-- 1. BOOKINGS
-- ============================================
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;

-- Admin peut tout voir
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin peut tout modifier
CREATE POLICY "Admins can update all bookings"
ON bookings FOR UPDATE
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

-- Admin peut supprimer
CREATE POLICY "Admins can delete bookings"
ON bookings FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin peut insérer
CREATE POLICY "Admins can insert bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 2. ACTIVITES_TOURISTIQUES
-- ============================================
ALTER TABLE IF EXISTS activites_touristiques ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public can view activites" ON activites_touristiques;
DROP POLICY IF EXISTS "Admins can view all activites" ON activites_touristiques;
DROP POLICY IF EXISTS "Admins can manage all activites" ON activites_touristiques;
DROP POLICY IF EXISTS "Enable read access for all users" ON activites_touristiques;

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

-- ============================================
-- 3. EVENEMENTS
-- ============================================
ALTER TABLE IF EXISTS evenements ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public can view evenements" ON evenements;
DROP POLICY IF EXISTS "Admins can view all evenements" ON evenements;
DROP POLICY IF EXISTS "Admins can manage all evenements" ON evenements;
DROP POLICY IF EXISTS "Enable read access for all users" ON evenements;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON evenements FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admins can manage all evenements"
ON evenements FOR ALL
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

-- Organisateurs et partenaires peuvent gérer leurs événements
CREATE POLICY "Organizers can manage own evenements"
ON evenements FOR ALL
TO authenticated
USING (
  auth.uid() = organizer_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
)
WITH CHECK (
  auth.uid() = organizer_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
);

-- ============================================
-- 4. ANNONCES
-- ============================================
ALTER TABLE IF EXISTS annonces ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public can view annonces" ON annonces;
DROP POLICY IF EXISTS "Admins can view all annonces" ON annonces;
DROP POLICY IF EXISTS "Admins can manage all annonces" ON annonces;
DROP POLICY IF EXISTS "Enable read access for all users" ON annonces;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON annonces FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admins can manage all annonces"
ON annonces FOR ALL
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

-- Utilisateurs peuvent gérer leurs propres annonces
CREATE POLICY "Users can manage own annonces"
ON annonces FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('partner', 'admin')
  )
);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Afficher toutes les politiques créées
SELECT 
    schemaname as "Schema",
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande",
    qual as "Condition"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'activites_touristiques', 'evenements', 'annonces')
ORDER BY tablename, policyname;

