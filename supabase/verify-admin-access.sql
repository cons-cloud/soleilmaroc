-- ============================================
-- VÉRIFICATION DE L'ACCÈS ADMIN
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script vérifie que tout est correctement configuré pour les admins

-- ============================================
-- 1. VÉRIFIER L'UTILISATEUR ACTUEL
-- ============================================

SELECT 
    'Utilisateur actuel' as "Vérification",
    auth.uid() as "ID",
    (auth.jwt() ->> 'role')::text as "Rôle dans JWT",
    (SELECT role FROM profiles WHERE id = auth.uid()) as "Rôle dans profiles";

-- ============================================
-- 2. VÉRIFIER QUE LES TABLES EXISTENT
-- ============================================

SELECT 
    'Tables existantes' as "Vérification",
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

-- ============================================
-- 3. VÉRIFIER QUE RLS EST ACTIVÉ
-- ============================================

SELECT 
    'RLS activé' as "Vérification",
    tablename as "Table",
    CASE 
        WHEN rowsecurity THEN '✅ Activé'
        ELSE '❌ Désactivé'
    END as "Statut"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'activites_touristiques');

-- ============================================
-- 4. VÉRIFIER LES POLITIQUES RLS
-- ============================================

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
-- 5. VÉRIFIER LA FONCTION is_admin()
-- ============================================

SELECT 
    'Fonction is_admin()' as "Vérification",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'is_admin' 
            AND pronamespace = 'public'::regnamespace
        ) THEN '✅ Existe'
        ELSE '❌ N''existe pas - Exécutez fix-rls-final-no-errors.sql'
    END as "Statut";

-- Tester la fonction si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE NOTICE 'Résultat is_admin(): %', is_admin();
    ELSE
        RAISE NOTICE 'La fonction is_admin() n''existe pas. Exécutez fix-rls-final-no-errors.sql.';
    END IF;
END $$;

-- ============================================
-- 6. VÉRIFIER LES PERMISSIONS GRANT
-- ============================================

SELECT 
    'Permissions GRANT' as "Vérification",
    table_name as "Table",
    privilege_type as "Permission"
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
AND table_schema = 'public'
AND table_name IN ('bookings', 'activites_touristiques')
ORDER BY table_name, privilege_type;

-- ============================================
-- 7. TEST D'ACCÈS (si vous êtes admin)
-- ============================================

-- Test de lecture sur bookings (ne devrait pas échouer si vous êtes admin)
DO $$
DECLARE
    can_read boolean;
BEGIN
    BEGIN
        PERFORM 1 FROM bookings LIMIT 1;
        can_read := true;
    EXCEPTION 
        WHEN insufficient_privilege OR OTHERS THEN
            can_read := false;
    END;
    
    IF can_read THEN
        RAISE NOTICE '✅ Test bookings SELECT: RÉUSSI';
    ELSE
        RAISE NOTICE '❌ Test bookings SELECT: ÉCHOUÉ - Vérifiez vos permissions RLS';
    END IF;
END $$;

-- Test de lecture sur activites_touristiques (ne devrait pas échouer)
DO $$
DECLARE
    can_read boolean;
BEGIN
    BEGIN
        PERFORM 1 FROM activites_touristiques LIMIT 1;
        can_read := true;
    EXCEPTION 
        WHEN insufficient_privilege OR OTHERS THEN
            can_read := false;
    END;
    
    IF can_read THEN
        RAISE NOTICE '✅ Test activites_touristiques SELECT: RÉUSSI';
    ELSE
        RAISE NOTICE '❌ Test activites_touristiques SELECT: ÉCHOUÉ - Vérifiez vos permissions RLS';
    END IF;
END $$;

-- ============================================
-- RÉSUMÉ DES ACTIONS REQUISES
-- ============================================

-- Si quelque chose échoue, exécutez dans l'ordre :
-- 1. create-activites-table.sql (si la table n'existe pas)
-- 2. fix-rls-final-no-errors.sql (pour corriger les permissions)

