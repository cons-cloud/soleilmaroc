-- =====================================================
-- TABLES MANQUANTES AVEC SUFFIXE _marocsoleil
-- =====================================================

-- 1. Table des catégories
CREATE TABLE IF NOT EXISTS public.categories_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Guides Touristiques
CREATE TABLE IF NOT EXISTS public.guides_touristiques_marocsoleil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.profiles_marocsoleil(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    languages TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    price_per_day NUMERIC(10,2) DEFAULT 0,
    city TEXT,
    phone TEXT,
    email TEXT,
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Immobilier
CREATE TABLE IF NOT EXISTS public.immobilier_marocsoleil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.profiles_marocsoleil(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles_marocsoleil(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT,
    transaction_type TEXT DEFAULT 'vente', -- vente | location
    price NUMERIC(12,2),
    city TEXT,
    address TEXT,
    surface_m2 NUMERIC(10,2),
    rooms INTEGER,
    bathrooms INTEGER,
    floor INTEGER,
    images TEXT[] DEFAULT '{}',
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inscriptions Événements
CREATE TABLE IF NOT EXISTS public.event_registrations_marocsoleil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.evenements_marocsoleil(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles_marocsoleil(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.profiles_marocsoleil(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    number_of_people INTEGER DEFAULT 1,
    total_amount NUMERIC(10,2) DEFAULT 0,
    registration_status TEXT DEFAULT 'pending', -- pending | confirmed | cancelled
    payment_status TEXT DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Activer RLS
ALTER TABLE public.guides_touristiques_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immobilier_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations_marocsoleil ENABLE ROW LEVEL SECURITY;

-- Suppression des policies existantes
DROP POLICY IF EXISTS "Public read guides" ON public.guides_touristiques_marocsoleil;
DROP POLICY IF EXISTS "Admin full guides" ON public.guides_touristiques_marocsoleil;
DROP POLICY IF EXISTS "Partner manage guides" ON public.guides_touristiques_marocsoleil;

DROP POLICY IF EXISTS "Public read immobilier" ON public.immobilier_marocsoleil;
DROP POLICY IF EXISTS "Admin full immobilier" ON public.immobilier_marocsoleil;
DROP POLICY IF EXISTS "Partner manage immobilier" ON public.immobilier_marocsoleil;

DROP POLICY IF EXISTS "Public read event_reg" ON public.event_registrations_marocsoleil;
DROP POLICY IF EXISTS "Admin full event_reg" ON public.event_registrations_marocsoleil;
DROP POLICY IF EXISTS "Partner view event_reg" ON public.event_registrations_marocsoleil;
DROP POLICY IF EXISTS "Client manage event_reg" ON public.event_registrations_marocsoleil;

-- Guides touristiques policies
CREATE POLICY "Public read guides" ON public.guides_touristiques_marocsoleil FOR SELECT USING (true);
CREATE POLICY "Admin full guides" ON public.guides_touristiques_marocsoleil FOR ALL TO authenticated USING (public.check_is_admin_v4());
CREATE POLICY "Partner manage guides" ON public.guides_touristiques_marocsoleil FOR ALL TO authenticated USING (auth.uid() = partner_id);

-- Immobilier policies
CREATE POLICY "Public read immobilier" ON public.immobilier_marocsoleil FOR SELECT USING (true);
CREATE POLICY "Admin full immobilier" ON public.immobilier_marocsoleil FOR ALL TO authenticated USING (public.check_is_admin_v4());
CREATE POLICY "Partner manage immobilier" ON public.immobilier_marocsoleil FOR ALL TO authenticated USING (auth.uid() = partner_id OR auth.uid() = user_id);

-- Event registrations policies
CREATE POLICY "Admin full event_reg" ON public.event_registrations_marocsoleil FOR ALL TO authenticated USING (public.check_is_admin_v4());
CREATE POLICY "Partner view event_reg" ON public.event_registrations_marocsoleil FOR SELECT TO authenticated USING (auth.uid() = partner_id);
CREATE POLICY "Client manage event_reg" ON public.event_registrations_marocsoleil FOR ALL TO authenticated USING (auth.uid() = client_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guides_touristiques_marocsoleil TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.immobilier_marocsoleil TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations_marocsoleil TO authenticated, anon;
