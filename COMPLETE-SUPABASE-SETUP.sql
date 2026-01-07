-- ================================================
-- SCRIPT COMPLET SUPABASE - MAROCSOLEIL
-- ================================================
-- Ce script crée TOUTES les tables nécessaires
-- pour le système de réservation et paiement
-- ================================================

-- ================================================
-- 1. EXTENSIONS
-- ================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 2. TABLE : bookings (Réservations unifiées)
-- ================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Références
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID NOT NULL,
  service_type VARCHAR(50) NOT NULL, -- 'hotel', 'appartement', 'villa', 'voiture', 'circuit'
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Détails
  guests INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  
  -- Informations client
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Détails supplémentaires
  special_requests TEXT,
  room_type VARCHAR(50),
  breakfast_included BOOLEAN DEFAULT false,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'
);

-- Index pour bookings
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- ================================================
-- 3. TABLE : payments (Paiements)
-- ================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Références
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Montants
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'cancelled', 'refunded'
  
  -- Méthode de paiement
  payment_method VARCHAR(50), -- 'card', 'cash', 'bank_transfer'
  
  -- Transaction
  transaction_id VARCHAR(255) UNIQUE,
  
  -- Stripe (optionnel)
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Informations carte (optionnel)
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  
  -- Dates
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'
);

-- Index pour payments
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- ================================================
-- 4. TABLE : hotels (Hôtels)
-- ================================================
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100),
  address TEXT,
  price_per_night NUMERIC(10, 2),
  images TEXT[],
  amenities TEXT[],
  rating INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 5. TABLE : appartements (Appartements)
-- ================================================
CREATE TABLE IF NOT EXISTS appartements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100),
  address TEXT,
  price_per_night NUMERIC(10, 2),
  images TEXT[],
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqm NUMERIC(10, 2),
  floor INTEGER,
  has_elevator BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_balcony BOOLEAN DEFAULT false,
  is_furnished BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 6. TABLE : villas (Villas)
-- ================================================
CREATE TABLE IF NOT EXISTS villas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100),
  address TEXT,
  price_per_night NUMERIC(10, 2),
  images TEXT[],
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqm NUMERIC(10, 2),
  has_pool BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_security BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 7. TABLE : locations_voitures (Voitures)
-- ================================================
CREATE TABLE IF NOT EXISTS locations_voitures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  description TEXT,
  price_per_day NUMERIC(10, 2),
  images TEXT[],
  category VARCHAR(50),
  fuel_type VARCHAR(50),
  transmission VARCHAR(50),
  seats INTEGER DEFAULT 5,
  doors INTEGER DEFAULT 4,
  has_ac BOOLEAN DEFAULT true,
  has_gps BOOLEAN DEFAULT false,
  has_bluetooth BOOLEAN DEFAULT false,
  city VARCHAR(100),
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 8. TABLE : circuits_touristiques (Circuits)
-- ================================================
CREATE TABLE IF NOT EXISTS circuits_touristiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_person NUMERIC(10, 2),
  images TEXT[],
  duration_days INTEGER DEFAULT 1,
  destinations TEXT[],
  included_services TEXT[],
  max_participants INTEGER,
  difficulty_level VARCHAR(50),
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 9. TABLE : partner_products (Produits partenaires)
-- ================================================
CREATE TABLE IF NOT EXISTS partner_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL, -- 'appartement', 'villa', 'hotel', 'voiture', 'circuit'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  price_type VARCHAR(50), -- 'per_night', 'per_day', 'per_person'
  city VARCHAR(100),
  address TEXT,
  images TEXT[],
  main_image TEXT,
  capacity INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  surface NUMERIC(10, 2),
  amenities TEXT[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour partner_products
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_type ON partner_products(product_type);

-- ================================================
-- 10. ROW LEVEL SECURITY (RLS) - bookings
-- ================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir leurs propres réservations
CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = client_id);

-- Les clients peuvent créer leurs propres réservations
CREATE POLICY "Clients can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Les admins peuvent tout modifier
CREATE POLICY "Admins can update all bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ================================================
-- 11. ROW LEVEL SECURITY (RLS) - payments
-- ================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir leurs propres paiements
CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = client_id);

-- Les clients peuvent créer leurs propres paiements
CREATE POLICY "Clients can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ================================================
-- 12. ROW LEVEL SECURITY (RLS) - Tables publiques
-- ================================================
-- Les tables de services sont publiques en lecture
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE appartements ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations_voitures ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuits_touristiques ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "Public can view hotels" ON hotels FOR SELECT USING (true);
CREATE POLICY "Public can view appartements" ON appartements FOR SELECT USING (true);
CREATE POLICY "Public can view villas" ON villas FOR SELECT USING (true);
CREATE POLICY "Public can view locations_voitures" ON locations_voitures FOR SELECT USING (true);
CREATE POLICY "Public can view circuits_touristiques" ON circuits_touristiques FOR SELECT USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage hotels" ON hotels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage appartements" ON appartements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage villas" ON villas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage locations_voitures" ON locations_voitures FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage circuits_touristiques" ON circuits_touristiques FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ================================================
-- 13. ROW LEVEL SECURITY (RLS) - partner_products
-- ================================================
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "Public can view partner_products" ON partner_products FOR SELECT USING (true);

-- Les partenaires peuvent gérer leurs propres produits
CREATE POLICY "Partners can manage own products" ON partner_products FOR ALL
  USING (auth.uid() = partner_id);

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all partner_products" ON partner_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ================================================
-- FIN DU SCRIPT
-- ================================================
-- Vérification : Exécutez cette requête pour vérifier que tout est créé
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('bookings', 'payments', 'hotels', 'appartements', 'villas', 'locations_voitures', 'circuits_touristiques', 'partner_products');

