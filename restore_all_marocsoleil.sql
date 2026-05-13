-- ==========================================================
-- SCRIPT DE RESTAURATION COMPLÈTE DU SCHÉMA MAROCSOLEIL (v2)
-- ==========================================================

-- 0. Fonctions de base et extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.check_is_admin_v4()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR (auth.jwt() ->> 'email') IN (
            'maroc2031@gmail.com', 
            'maroc2032@gmail.com', 
            'admin@marocsoleil.ma',
            'webconsulting66@gmail.com',
            'jamilaaitbouchnani@gmail.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Tables de base manquantes
CREATE TABLE IF NOT EXISTS public.guides_touristiques_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.immobilier_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT,
    transaction_type TEXT DEFAULT 'vente',
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

CREATE TABLE IF NOT EXISTS public.event_registrations_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.evenements_marocsoleil(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    number_of_people INTEGER DEFAULT 1,
    total_amount NUMERIC(10,2) DEFAULT 0,
    registration_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

CREATE TABLE IF NOT EXISTS public.coupons_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contacts_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activites_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    city TEXT,
    images TEXT[],
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_earnings_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    commission NUMERIC(12,2) NOT NULL,
    partner_amount NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories
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

-- 2. Activation de RLS et Politiques
DO $$
DECLARE
    t_name TEXT;
    all_tables TEXT[] := ARRAY[
        'guides_touristiques_marocsoleil',
        'immobilier_marocsoleil',
        'event_registrations_marocsoleil',
        'notifications_marocsoleil',
        'comments_marocsoleil',
        'wishlist_marocsoleil',
        'coupons_marocsoleil',
        'settings_marocsoleil',
        'contacts_marocsoleil',
        'activites_marocsoleil',
        'restaurants_marocsoleil',
        'partner_earnings_marocsoleil',
        'categories_marocsoleil'
    ];
BEGIN
    FOREACH t_name IN ARRAY all_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name AND table_schema = 'public') THEN
            -- Activer RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
            
            -- Permissions
            EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres', t_name);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t_name);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO authenticated', t_name);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO anon', t_name);

            -- Politiques Admin
            EXECUTE format('DROP POLICY IF EXISTS "Admin full access %s" ON public.%I', t_name, t_name);
            EXECUTE format('CREATE POLICY "Admin full access %s" ON public.%I FOR ALL TO authenticated USING (public.check_is_admin_v4())', t_name, t_name);
            
            -- Lecture Publique
            EXECUTE format('DROP POLICY IF EXISTS "Public read %s" ON public.%I', t_name, t_name);
            EXECUTE format('CREATE POLICY "Public read %s" ON public.%I FOR SELECT USING (true)', t_name, t_name);
            
            -- Politiques spécifiques
            IF t_name = 'wishlist_marocsoleil' OR t_name = 'notifications_marocsoleil' THEN
                EXECUTE format('DROP POLICY IF EXISTS "User own %s" ON public.%I', t_name, t_name);
                EXECUTE format('CREATE POLICY "User own %s" ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id)', t_name, t_name);
            END IF;

            IF t_name = 'event_registrations_marocsoleil' THEN
                EXECUTE format('DROP POLICY IF EXISTS "Client own %s" ON public.%I', t_name, t_name);
                EXECUTE format('CREATE POLICY "Client own %s" ON public.%I FOR ALL TO authenticated USING (auth.uid() = client_id)', t_name, t_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 3. Données initiales
INSERT INTO public.categories_marocsoleil (name, slug, description, image_url, icon)
VALUES 
('Hôtels', 'hotels', 'Sélections d''hôtels de luxe et de charme', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', 'Hotel'),
('Villas', 'villas', 'Villas privées avec piscine et services', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'Home'),
('Appartements', 'appartements', 'Appartements modernes au coeur des villes', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'Building2'),
('Voitures', 'voitures', 'Location de véhicules tout confort', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2', 'Car'),
('Circuits', 'circuits', 'Expériences et circuits touristiques guidés', 'https://images.unsplash.com/photo-1530789253488-b4137f89acb6', 'Compass'),
('Événements', 'evenements', 'Festivals, concerts et événements locaux', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', 'Calendar'),
('Restaurants', 'restaurants', 'Découvrez les meilleures tables du Maroc', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 'Utensils')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    icon = EXCLUDED.icon;
