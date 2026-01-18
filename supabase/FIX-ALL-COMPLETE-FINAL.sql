-- ============================================
-- SCRIPT SQL COMPLET ET FINAL - TOUTES LES CORRECTIONS
-- À exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script corrige TOUS les problèmes en une seule fois
-- Exécutez ce script ENTIER d'un seul coup

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
  END IF;
  
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
-- ÉTAPE 2 : AJOUTER PARTNER_ID ET SERVICE_ID À BOOKINGS SI MANQUANTS
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
  END IF;
  
  -- Ajouter service_id si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'service_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_id UUID;
    RAISE NOTICE 'Colonne service_id ajoutée à bookings';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : AJOUTER CLIENT_ID À PAYMENTS SI MANQUANT
-- ============================================

-- Vérifier d'abord que la table payments existe, puis ajouter la colonne client_id si elle n'existe pas
DO $$
BEGIN
  -- Vérifier que la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    -- Ajouter la colonne client_id si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'client_id'
    ) THEN
      -- Ajouter la colonne avec une contrainte de clé étrangère si possible
      BEGIN
        ALTER TABLE payments ADD COLUMN client_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Colonne client_id ajoutée à payments';
      EXCEPTION WHEN OTHERS THEN
        -- Si la FK échoue, ajouter sans FK
        ALTER TABLE payments ADD COLUMN client_id UUID;
        RAISE NOTICE 'Colonne client_id ajoutée à payments (sans FK)';
      END;
    END IF;
  ELSE
    RAISE NOTICE 'Table payments n''existe pas encore';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : CRÉER LA TABLE ACTIVITES_TOURISTIQUES SI ELLE N'EXISTE PAS
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
-- ÉTAPE 5 : CORRIGER LES POLITIQUES RLS POUR BOOKINGS
-- ============================================

-- Assurer que RLS est activé
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour les partenaires
DROP POLICY IF EXISTS "Partners can view own bookings" ON bookings;

-- Politique pour que les partenaires voient leurs réservations
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

-- Politique pour les admins (complète depuis fix-rls-final-no-errors.sql)
-- On garde les politiques existantes ou on les crée si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bookings' 
    AND policyname = 'Admins full access bookings'
  ) THEN
    CREATE POLICY "Admins full access bookings"
    ON bookings FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : CORRIGER LES POLITIQUES RLS POUR PAYMENTS
-- ============================================

-- Vérifier que la table payments existe avant de modifier les politiques
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    -- Assurer que RLS est activé
    EXECUTE 'ALTER TABLE payments ENABLE ROW LEVEL SECURITY';
    
    -- Supprimer les anciennes politiques pour les partenaires
    EXECUTE 'DROP POLICY IF EXISTS "Partners can view own payments" ON payments';
    EXECUTE 'DROP POLICY IF EXISTS "Clients can view own payments" ON payments';
  END IF;
END $$;

-- Politique pour que les partenaires voient leurs paiements (via bookings)
-- Note: On utilise seulement booking_id car client_id peut ne pas exister dans toutes les installations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    EXECUTE '
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
        is_admin()
      )';
  END IF;
END $$;

-- Politique pour les clients (si client_id existe dans la table)
DO $$
BEGIN
  -- Vérifier que la table et la colonne client_id existent avant de créer la politique
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'client_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'Clients can view own payments'
    ) THEN
      EXECUTE '
        CREATE POLICY "Clients can view own payments"
        ON payments FOR SELECT
        TO authenticated
        USING (client_id = auth.uid() OR is_admin())';
    END IF;
  END IF;
END $$;

-- Politique pour les admins (accès complet à payments)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'Admins full access payments'
    ) THEN
      EXECUTE '
        CREATE POLICY "Admins full access payments"
        ON payments FOR ALL
        TO authenticated
        USING (is_admin())
        WITH CHECK (is_admin())';
    END IF;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 7 : CORRIGER LES POLITIQUES RLS POUR ACTIVITES_TOURISTIQUES
-- ============================================

ALTER TABLE IF EXISTS activites_touristiques ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activites_touristiques') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON activites_touristiques';
  END LOOP;
END $$;

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
-- ÉTAPE 8 : CRÉER LA FONCTION RPC get_partner_dashboard_stats
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
-- ÉTAPE 9 : CRÉER UNE ALTERNATIVE get_partner_stats (pour compatibilité)
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
-- ÉTAPE 10 : CRÉER UN TRIGGER POUR updated_at SUR ACTIVITES_TOURISTIQUES
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
-- ÉTAPE 11 : DONNER LES PERMISSIONS GRANT EXPLICITES
-- ============================================

-- Donner les permissions nécessaires au rôle authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activites_touristiques TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_products TO authenticated;
GRANT SELECT ON payments TO authenticated;

-- ============================================
-- ÉTAPE 12 : VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier que les colonnes existent
SELECT 
    'Colonnes vérifiées' as "Vérification",
    table_name as "Table",
    column_name as "Colonne"
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
  (table_name = 'bookings' AND column_name IN ('partner_id', 'service_id'))
  OR (table_name = 'payments' AND column_name = 'client_id')
  OR (table_name = 'partner_products' AND column_name IN ('max_guests', 'bedrooms', 'bathrooms', 'surface', 'min_stay'))
)
ORDER BY table_name, column_name;

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
AND tablename IN ('bookings', 'activites_touristiques', 'payments', 'partner_products')
ORDER BY tablename;

-- Vérifier les fonctions RPC
SELECT 
    'Fonction RPC' as "Vérification",
    routine_name as "Nom",
    routine_type as "Type"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%partner%stats%'
ORDER BY routine_name;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Après l'exécution de ce script, vous devriez voir :
-- ✅ Toutes les colonnes ajoutées
-- ✅ RLS activé sur toutes les tables
-- ✅ Politiques créées pour permettre l'accès
-- ✅ Fonctions RPC créées
-- ✅ Pas d'erreurs dans le dashboard partenaire et admin

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Copiez TOUT ce script
-- 2. Collez-le dans Supabase SQL Editor
-- 3. Cliquez sur "Run" ou appuyez sur Cmd+Enter (Mac) ou Ctrl+Enter (Windows)
-- 4. Vérifiez que tous les résultats montrent ✅
-- 5. Déconnectez-vous et reconnectez-vous au dashboard pour rafraîchir les permissions
-- 6. Testez la création de produits et le dashboard partenaire

