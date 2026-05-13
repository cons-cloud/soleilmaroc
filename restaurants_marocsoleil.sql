-- Création de la table restaurants_marocsoleil
CREATE TABLE IF NOT EXISTS public.restaurants_marocsoleil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    address TEXT,
    cuisine_type TEXT, -- Ex: Marocaine, Italienne, etc.
    menu JSONB DEFAULT '[]'::jsonb, -- Liste des plats [{name, description, price}]
    price_range TEXT, -- Ex: $, $$, $$$
    main_image TEXT,
    images TEXT[] DEFAULT '{}'::text[],
    capacity INTEGER,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Politiques RLS
ALTER TABLE public.restaurants_marocsoleil ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active restaurants_marocsoleil" ON public.restaurants_marocsoleil;
CREATE POLICY "Public can view active restaurants_marocsoleil" 
ON public.restaurants_marocsoleil FOR SELECT 
USING (available = true);

DROP POLICY IF EXISTS "Partners can manage own restaurants_marocsoleil" ON public.restaurants_marocsoleil;
CREATE POLICY "Partners can manage own restaurants_marocsoleil" 
ON public.restaurants_marocsoleil FOR ALL 
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Admins can manage all restaurants_marocsoleil" ON public.restaurants_marocsoleil;
CREATE POLICY "Admins can manage all restaurants_marocsoleil" 
ON public.restaurants_marocsoleil FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles_marocsoleil 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_restaurants_marocsoleil_city ON public.restaurants_marocsoleil(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_marocsoleil_partner ON public.restaurants_marocsoleil(partner_id);

-- Ajouter la catégorie Restaurant de manière sécurisée
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.categories_marocsoleil WHERE slug = 'restaurants') THEN
        INSERT INTO public.categories_marocsoleil (name, slug, description, icon)
        VALUES ('Restaurants', 'restaurants', 'Découvrez les meilleurs restaurants du Maroc', 'Utensils');
    END IF;
END $$;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_restaurants_marocsoleil_updated_at ON public.restaurants_marocsoleil;
CREATE TRIGGER update_restaurants_marocsoleil_updated_at
    BEFORE UPDATE ON public.restaurants_marocsoleil
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
