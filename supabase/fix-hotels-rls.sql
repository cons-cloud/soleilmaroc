-- ============================================
-- FIX PERMISSIONS RLS POUR LA TABLE HOTELS
-- ============================================
-- Ce script corrige les permissions pour que les admins, partenaires et clients puissent accéder à la table hotels
-- À exécuter dans Supabase SQL Editor

-- Activer RLS sur hotels si ce n'est pas déjà fait
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view published hotels" ON hotels;
DROP POLICY IF EXISTS "Admins can manage hotels" ON hotels;
DROP POLICY IF EXISTS "Public read access" ON hotels;
DROP POLICY IF EXISTS "Admin full access" ON hotels;
DROP POLICY IF EXISTS "Enable read access for all users" ON hotels;
DROP POLICY IF EXISTS "Partners can read hotels" ON hotels;
DROP POLICY IF EXISTS "Clients can read hotels" ON hotels;

-- Politique 1 : Lecture publique (tous les utilisateurs peuvent voir les hôtels disponibles)
CREATE POLICY "Public read access for hotels"
ON hotels FOR SELECT
USING (true);

-- Politique 2 : Les admins peuvent tout faire (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access to hotels"
ON hotels FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Politique 3 : Les partenaires peuvent lire les hôtels
CREATE POLICY "Partners can read hotels"
ON hotels FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'partenaire'
  )
);

-- Politique 4 : Les clients peuvent lire les hôtels
CREATE POLICY "Clients can read hotels"
ON hotels FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'client'
  )
);

-- Vérification : Afficher les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'hotels'
ORDER BY policyname;












