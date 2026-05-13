-- ==========================================================
-- SCRIPT DE CREATION DES TABLES MANQUANTES - MAROCSOLEIL
-- ==========================================================

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

-- Insertion initiales
INSERT INTO public.categories_marocsoleil (name, slug, description, image_url)
VALUES 
('Hôtels', 'hotels', 'Sélections d''hôtels de luxe et de charme', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'),
('Villas', 'villas', 'Villas privées avec piscine et services', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'),
('Appartements', 'appartements', 'Appartements modernes au coeur des villes', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'),
('Voitures', 'voitures', 'Location de véhicules tout confort', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2'),
('Circuits', 'circuits', 'Expériences et circuits touristiques guidés', 'https://images.unsplash.com/photo-1530789253488-b4137f89acb6'),
('Événements', 'evenements', 'Festivals, concerts et événements locaux', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30')
ON CONFLICT DO NOTHING;

-- 2. Création des tables manquantes
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
    service_id UUID NOT NULL, -- Peut référencer partner_products ou services_marocsoleil
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

-- 3. Activation de RLS sur les nouvelles tables
ALTER TABLE public.notifications_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts_marocsoleil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_marocsoleil ENABLE ROW LEVEL SECURITY;

-- 4. Application des politiques Admin (via la fonction check_is_admin_v4 déjà existante)
-- Note: On assume que check_is_admin_v4 existe déjà.

DO $$
DECLARE
    t_name TEXT;
    new_tables TEXT[] := ARRAY[
        'notifications_marocsoleil',
        'comments_marocsoleil',
        'wishlist_marocsoleil',
        'coupons_marocsoleil',
        'settings_marocsoleil',
        'contacts_marocsoleil',
        'activites_marocsoleil'
    ];
BEGIN
    FOREACH t_name IN ARRAY new_tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access %s" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "Admin full access %s" ON public.%I FOR ALL TO authenticated USING (public.check_is_admin_v4())', t_name, t_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "Public read %s" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "Public read %s" ON public.%I FOR SELECT USING (true)', t_name, t_name);
    END LOOP;
END $$;
