-- ============================================
-- FIX RLS FINAL - AUCUNE ERREUR 403
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script garantit l'accès complet aux admins sans erreurs 403
-- Pour les tables: bookings, activites_touristiques

-- ============================================
-- ÉTAPE 1 : CRÉER UNE FONCTION HELPER POUR ÉVITER LA RÉCURSION
-- ============================================

-- Fonction pour vérifier si l'utilisateur est admin (évite la récursion)
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
-- ÉTAPE 2 : BOOKINGS - SUPPRIMER TOUTES LES POLITIQUES
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
-- ÉTAPE 3 : BOOKINGS - CRÉER NOUVELLES POLITIQUES SIMPLES
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
-- ÉTAPE 4 : ACTIVITES_TOURISTIQUES - SUPPRIMER TOUTES LES POLITIQUES
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
-- ÉTAPE 5 : ACTIVITES_TOURISTIQUES - CRÉER NOUVELLES POLITIQUES SIMPLES
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
-- ÉTAPE 6 : VÉRIFICATION ET GRANT EXPLICITE (SI NÉCESSAIRE)
-- ============================================

-- Donner les permissions nécessaires au rôle authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activites_touristiques TO authenticated;

-- ============================================
-- ÉTAPE 7 : VÉRIFICATION DES POLITIQUES
-- ============================================

SELECT 
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande",
    CASE 
      WHEN qual IS NOT NULL THEN substring(qual from 1 for 100)
      ELSE 'N/A'
    END as "Condition"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'activites_touristiques')
ORDER BY tablename, policyname;

-- ============================================
-- ÉTAPE 8 : TEST RAPIDE
-- ============================================

-- Vérifier que RLS est activé
SELECT 
    tablename,
    rowsecurity as "RLS Activé"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'activites_touristiques');

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

/*
✅ CORRECTIONS APPLIQUÉES :

1. Fonction helper `is_admin()` :
   - Utilise SECURITY DEFINER pour éviter la récursion
   - Vérifie d'abord auth.jwt(), puis profiles
   - Plus performant et plus sûr

2. Suppression complète des anciennes politiques :
   - Désactive RLS temporairement
   - Supprime toutes les politiques existantes
   - Évite les conflits

3. Politiques simples et claires :
   - Admins : accès complet avec is_admin()
   - Utilisateurs : leurs propres données
   - Public : lecture pour activites_touristiques

4. GRANT explicite :
   - Assure que authenticated a les permissions nécessaires
   - Complète les politiques RLS

⚠️ SI LES ERREURS PERSISTENT :

1. Vérifiez que vous êtes bien connecté en tant qu'admin
2. Vérifiez que votre profil a role = 'admin' dans la table profiles
3. Réexécutez ce script complet
4. Déconnectez-vous et reconnectez-vous pour rafraîchir le JWT
*/

