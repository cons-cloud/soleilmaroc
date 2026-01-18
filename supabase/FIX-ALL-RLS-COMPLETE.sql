-- ============================================
-- SCRIPT SQL COMPLET POUR CORRIGER TOUS LES PROBLÈMES RLS
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script corrige toutes les permissions RLS pour que le dashboard admin fonctionne
-- Exécutez ce script ENTIER d'un seul coup

-- ============================================
-- ÉTAPE 1 : CRÉER LA TABLE ACTIVITES_TOURISTIQUES SI ELLE N'EXISTE PAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.activites_touristiques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  activity_type VARCHAR(50),
  duration_hours DECIMAL(4,2),
  price_per_person DECIMAL(10,2) NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  images TEXT[],
  includes JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
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

-- ============================================
-- ÉTAPE 2 : CRÉER UNE FONCTION HELPER POUR ÉVITER LA RÉCURSION RLS
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Essayer d'abord avec auth.jwt() (si le rôle est dans le JWT)
  IF (auth.jwt() ->> 'role')::text = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Sinon, vérifier dans profiles (avec SECURITY DEFINER pour éviter la récursion)
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- ============================================
-- ÉTAPE 3 : BOOKINGS - SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ============================================

-- Désactiver RLS temporairement pour supprimer toutes les politiques
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON bookings';
  END LOOP;
END $$;

-- Réactiver RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 4 : BOOKINGS - CRÉER NOUVELLES POLITIQUES SIMPLES
-- ============================================

-- Politique pour les admins : accès complet (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins full access bookings"
ON bookings FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Politique pour les utilisateurs : voir leurs propres réservations
CREATE POLICY "Users view own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = client_id OR auth.uid() = user_id);

-- Politique pour les utilisateurs : créer leurs propres réservations
CREATE POLICY "Users create own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id OR auth.uid() = user_id);

-- ============================================
-- ÉTAPE 5 : ACTIVITES_TOURISTIQUES - SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ============================================

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS activites_touristiques DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activites_touristiques') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON activites_touristiques';
  END LOOP;
END $$;

-- Réactiver RLS
ALTER TABLE activites_touristiques ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6 : ACTIVITES_TOURISTIQUES - CRÉER NOUVELLES POLITIQUES SIMPLES
-- ============================================

-- Lecture publique pour tous
CREATE POLICY "Public read activites"
ON activites_touristiques FOR SELECT
USING (true);

-- Admins : accès complet
CREATE POLICY "Admins full access activites"
ON activites_touristiques FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Partenaires : gérer leurs propres activités
CREATE POLICY "Partners manage own activites"
ON activites_touristiques FOR ALL
TO authenticated
USING (
  auth.uid() = partner_id OR 
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  is_admin()
)
WITH CHECK (
  auth.uid() = partner_id OR 
  (auth.jwt() ->> 'role')::text IN ('partner', 'admin') OR
  is_admin()
);

-- ============================================
-- ÉTAPE 7 : DONNER LES PERMISSIONS GRANT EXPLICITES
-- ============================================

-- Donner les permissions nécessaires au rôle authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activites_touristiques TO authenticated;

-- ============================================
-- ÉTAPE 8 : CRÉER UN TRIGGER POUR updated_at SUR ACTIVITES_TOURISTIQUES
-- ============================================

-- Créer la fonction de trigger si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_activites_touristiques_updated_at ON activites_touristiques;
CREATE TRIGGER update_activites_touristiques_updated_at
BEFORE UPDATE ON activites_touristiques
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 9 : VÉRIFICATION FINALE
-- ============================================

-- Vérifier que les tables existent
SELECT 
    'Tables vérifiées' as "Vérification",
    tablename as "Table",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tablename
        ) THEN '✅ Existe'
        ELSE '❌ N''existe pas'
    END as "Statut"
FROM (VALUES ('bookings'), ('activites_touristiques')) AS t(tablename);

-- Vérifier que RLS est activé
SELECT 
    'RLS vérifié' as "Vérification",
    tablename as "Table",
    CASE 
        WHEN rowsecurity THEN '✅ Activé'
        ELSE '❌ Désactivé'
    END as "Statut"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'activites_touristiques');

-- Afficher les politiques créées
SELECT 
    'Politiques RLS' as "Vérification",
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'activites_touristiques')
ORDER BY tablename, policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Après l'exécution de ce script, vous devriez voir :
-- ✅ Tables créées : bookings, activites_touristiques
-- ✅ RLS activé sur les deux tables
-- ✅ Politiques créées pour permettre l'accès admin complet
-- ✅ Pas d'erreurs 403 dans le dashboard admin

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Copiez TOUT ce script
-- 2. Collez-le dans Supabase SQL Editor
-- 3. Cliquez sur "Run" ou appuyez sur Cmd+Enter (Mac) ou Ctrl+Enter (Windows)
-- 4. Vérifiez que tous les résultats montrent ✅
-- 5. Déconnectez-vous et reconnectez-vous au dashboard admin pour rafraîchir les permissions
-- 6. Testez les onglets "Réservations" et "Activités"

