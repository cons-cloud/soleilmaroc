-- ============================================
-- SCRIPT SQL COMPLET POUR CORRIGER LES PROBLÈMES PARTENAIRE
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script corrige tous les problèmes liés aux produits partenaire et dashboard

-- ============================================
-- ÉTAPE 0 : CRÉER LA FONCTION is_admin() SI ELLE N'EXISTE PAS
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
-- ÉTAPE 1 : VÉRIFIER ET CORRIGER LA TABLE PARTNER_PRODUCTS
-- ============================================

-- Ajouter la colonne max_guests si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_products' 
    AND column_name = 'max_guests'
  ) THEN
    ALTER TABLE partner_products ADD COLUMN max_guests INTEGER;
    RAISE NOTICE 'Colonne max_guests ajoutée à partner_products';
  ELSE
    RAISE NOTICE 'Colonne max_guests existe déjà';
  END IF;
END $$;

-- Ajouter d'autres colonnes qui pourraient manquer
DO $$
BEGIN
  -- Ajouter bedrooms si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_products' 
    AND column_name = 'bedrooms'
  ) THEN
    ALTER TABLE partner_products ADD COLUMN bedrooms INTEGER;
  END IF;
  
  -- Ajouter bathrooms si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_products' 
    AND column_name = 'bathrooms'
  ) THEN
    ALTER TABLE partner_products ADD COLUMN bathrooms INTEGER;
  END IF;
  
  -- Ajouter surface si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_products' 
    AND column_name = 'surface'
  ) THEN
    ALTER TABLE partner_products ADD COLUMN surface INTEGER;
  END IF;
  
  -- Ajouter min_stay si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_products' 
    AND column_name = 'min_stay'
  ) THEN
    ALTER TABLE partner_products ADD COLUMN min_stay INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : AJOUTER PARTNER_ID À BOOKINGS SI MANQUANT
-- ============================================

-- Ajouter la colonne partner_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN partner_id UUID REFERENCES profiles(id);
    RAISE NOTICE 'Colonne partner_id ajoutée à bookings';
  ELSE
    RAISE NOTICE 'Colonne partner_id existe déjà dans bookings';
  END IF;
END $$;

-- Ajouter la colonne service_id si elle n'existe pas (pour lier aux produits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'service_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_id UUID;
    RAISE NOTICE 'Colonne service_id ajoutée à bookings';
  ELSE
    RAISE NOTICE 'Colonne service_id existe déjà dans bookings';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : CORRIGER LES POLITIQUES RLS POUR BOOKINGS AVEC PARTNER_ID
-- ============================================

-- Assurer que RLS est activé
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Politique pour que les partenaires voient leurs réservations
DROP POLICY IF EXISTS "Partners can view own bookings" ON bookings;

CREATE POLICY "Partners can view own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  partner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM partner_products
    WHERE partner_products.id = bookings.service_id
    AND partner_products.partner_id = auth.uid()
  ) OR
  is_admin()
);

-- ============================================
-- ÉTAPE 4 : CORRIGER LES POLITIQUES RLS POUR PAYMENTS AVEC PARTNER_ID
-- ============================================

-- Assurer que RLS est activé
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

-- Politique pour que les partenaires voient leurs paiements (via bookings)
DROP POLICY IF EXISTS "Partners can view own payments" ON payments;

CREATE POLICY "Partners can view own payments"
ON payments FOR SELECT
TO authenticated
USING (
  -- Via booking si le booking a un partner_id
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = payments.booking_id
    AND (
      bookings.partner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM partner_products
        WHERE partner_products.id = bookings.service_id
        AND partner_products.partner_id = auth.uid()
      )
    )
  ) OR
  client_id = auth.uid() OR
  is_admin()
);

-- ============================================
-- ÉTAPE 5 : CRÉER LA FONCTION RPC get_partner_dashboard_stats
-- ============================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS get_partner_dashboard_stats(UUID);

-- Créer la fonction
CREATE OR REPLACE FUNCTION get_partner_dashboard_stats(p_partner_id UUID)
RETURNS TABLE (
  total_products INTEGER,
  available_products INTEGER,
  total_bookings INTEGER,
  pending_bookings INTEGER,
  total_revenue DECIMAL,
  pending_revenue DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total produits
    (SELECT COUNT(*)::INTEGER FROM partner_products WHERE partner_id = p_partner_id) as total_products,
    
    -- Produits disponibles
    (SELECT COUNT(*)::INTEGER FROM partner_products WHERE partner_id = p_partner_id AND available = true) as available_products,
    
    -- Total réservations
    (SELECT COUNT(*)::INTEGER FROM bookings 
     WHERE partner_id = p_partner_id 
     OR EXISTS (
       SELECT 1 FROM partner_products 
       WHERE partner_products.id = bookings.service_id 
       AND partner_products.partner_id = p_partner_id
     )) as total_bookings,
    
    -- Réservations en attente
    (SELECT COUNT(*)::INTEGER FROM bookings 
     WHERE status = 'pending' 
     AND (
       partner_id = p_partner_id 
       OR EXISTS (
         SELECT 1 FROM partner_products 
         WHERE partner_products.id = bookings.service_id 
         AND partner_products.partner_id = p_partner_id
       )
     )) as pending_bookings,
    
    -- Revenu total
    (SELECT COALESCE(SUM(total_amount), 0)::DECIMAL FROM bookings 
     WHERE status IN ('confirmed', 'completed')
     AND (
       partner_id = p_partner_id 
       OR EXISTS (
         SELECT 1 FROM partner_products 
         WHERE partner_products.id = bookings.service_id 
         AND partner_products.partner_id = p_partner_id
       )
     )) as total_revenue,
    
    -- Revenu en attente
    (SELECT COALESCE(SUM(total_amount), 0)::DECIMAL FROM bookings 
     WHERE status = 'pending'
     AND (
       partner_id = p_partner_id 
       OR EXISTS (
         SELECT 1 FROM partner_products 
         WHERE partner_products.id = bookings.service_id 
         AND partner_products.partner_id = p_partner_id
       )
     )) as pending_revenue;
END;
$$;

-- ============================================
-- ÉTAPE 6 : CRÉER UNE ALTERNATIVE get_partner_stats (pour compatibilité)
-- ============================================

DROP FUNCTION IF EXISTS get_partner_stats(UUID);

CREATE OR REPLACE FUNCTION get_partner_stats(partner_id UUID)
RETURNS TABLE (
  total_products INTEGER,
  available_products INTEGER,
  total_bookings INTEGER,
  pending_bookings INTEGER,
  total_revenue DECIMAL,
  pending_revenue DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_partner_dashboard_stats(partner_id);
END;
$$;

-- ============================================
-- ÉTAPE 7 : VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier les colonnes de partner_products
SELECT 
    'Colonnes partner_products' as "Vérification",
    column_name as "Colonne",
    data_type as "Type"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'partner_products'
ORDER BY ordinal_position;

-- Vérifier que la fonction existe
SELECT 
    'Fonction RPC' as "Vérification",
    routine_name as "Nom",
    routine_type as "Type"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%partner%stats%'
ORDER BY routine_name;

-- Vérifier les politiques RLS sur bookings
SELECT 
    'Politiques RLS bookings' as "Vérification",
    policyname as "Politique",
    cmd as "Commande"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'bookings'
AND policyname LIKE '%Partner%'
ORDER BY policyname;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

/*
✅ CORRECTIONS APPLIQUÉES :

1. Colonne max_guests ajoutée à partner_products
2. Colonnes supplémentaires ajoutées (bedrooms, bathrooms, surface, min_stay)
3. Fonction RPC get_partner_dashboard_stats créée
4. Politiques RLS pour bookings avec partner_id corrigées
5. Politiques RLS pour payments avec partner_id corrigées

⚠️ IMPORTANT :
- Les partenaires peuvent maintenant voir leurs réservations
- La fonction RPC calcule les statistiques du dashboard partenaire
- Toutes les colonnes nécessaires sont présentes

🔄 APRÈS EXÉCUTION :
1. Rechargez le dashboard partenaire
2. Testez la création d'un produit
3. Vérifiez que les statistiques s'affichent correctement
*/

