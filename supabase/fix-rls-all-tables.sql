-- ============================================
-- FIX RLS POUR CORRIGER LES ERREURS 400/406
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script corrige les politiques RLS pour permettre l'accès public en lecture
-- aux tables circuits_touristiques, hotels, villas, etc.

-- ============================================
-- 1. CIRCUITS_TOURISTIQUES
-- ============================================
ALTER TABLE IF EXISTS circuits_touristiques ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public read access" ON circuits_touristiques;
DROP POLICY IF EXISTS "Public can view available circuits" ON circuits_touristiques;
DROP POLICY IF EXISTS "Admin full access" ON circuits_touristiques;
DROP POLICY IF EXISTS "Enable read access for all users" ON circuits_touristiques;
DROP POLICY IF EXISTS "Anyone can view published circuits" ON circuits_touristiques;

-- Lecture publique (anonyme + authentifié) - SANS condition
CREATE POLICY "Enable read access for all users"
ON circuits_touristiques FOR SELECT
USING (true);

-- Admin peut tout faire (utiliser auth.jwt() pour éviter la récursion)
CREATE POLICY "Admin full access"
ON circuits_touristiques FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 2. HOTELS
-- ============================================
ALTER TABLE IF EXISTS hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON hotels;
DROP POLICY IF EXISTS "Anyone can view published hotels" ON hotels;
DROP POLICY IF EXISTS "Admin full access" ON hotels;
DROP POLICY IF EXISTS "Enable read access for all users" ON hotels;
DROP POLICY IF EXISTS "Public read access for hotels" ON hotels;
DROP POLICY IF EXISTS "Admin full access to hotels" ON hotels;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON hotels FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admin full access"
ON hotels FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 3. VILLAS
-- ============================================
ALTER TABLE IF EXISTS villas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON villas;
DROP POLICY IF EXISTS "Anyone can view published villas" ON villas;
DROP POLICY IF EXISTS "Admin full access" ON villas;
DROP POLICY IF EXISTS "Enable read access for all users" ON villas;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON villas FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admin full access"
ON villas FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 4. APPARTEMENTS
-- ============================================
ALTER TABLE IF EXISTS appartements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON appartements;
DROP POLICY IF EXISTS "Anyone can view published appartements" ON appartements;
DROP POLICY IF EXISTS "Admin full access" ON appartements;
DROP POLICY IF EXISTS "Enable read access for all users" ON appartements;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON appartements FOR SELECT
USING (true);

-- Admin peut tout faire
CREATE POLICY "Admin full access"
ON appartements FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 5. PARTNER_PRODUCTS
-- ============================================
ALTER TABLE IF EXISTS partner_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view available products" ON partner_products;
DROP POLICY IF EXISTS "Public can view partner_products" ON partner_products;
DROP POLICY IF EXISTS "Partners can manage own products" ON partner_products;
DROP POLICY IF EXISTS "Partners and admins can manage" ON partner_products;
DROP POLICY IF EXISTS "Admin full access" ON partner_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON partner_products;

-- Lecture publique
CREATE POLICY "Enable read access for all users"
ON partner_products FOR SELECT
USING (true);

-- Partenaires et admins peuvent gérer
CREATE POLICY "Partners and admins can manage"
ON partner_products FOR ALL
TO authenticated
USING (
  auth.uid() = partner_id OR 
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('partner', 'admin'))
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
AND tablename IN ('circuits_touristiques', 'hotels', 'villas', 'appartements', 'partner_products')
ORDER BY tablename, policyname;

