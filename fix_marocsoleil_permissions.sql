-- ==========================================================
-- SCRIPT DE CORRECTION DES PERMISSIONS (v4) - MAROCSOLEIL
-- ==========================================================
-- Suppression totale de la récursion en utilisant uniquement le JWT.
-- ==========================================================

-- 0. Fonction de vérification admin ultra-sécurisée (zéro requête table)
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

GRANT EXECUTE ON FUNCTION public.check_is_admin_v4() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin_v4() TO anon;

DO $$
DECLARE
    t_name TEXT;
    tables_to_fix TEXT[] := ARRAY[
        'appartements_marocsoleil', 'properties_marocsoleil', 'evenements_marocsoleil', 'site_content_marocsoleil', 
        'activites_touristiques_marocsoleil', 'locations_voitures_marocsoleil', 'categories_marocsoleil', 
        'payments_marocsoleil', 'reviews_marocsoleil', 'images_marocsoleil', 'profiles_marocsoleil', 'cars_marocsoleil', 'apartments_marocsoleil', 
        'villas_marocsoleil', 'hotels_marocsoleil', 'tourism_marocsoleil', 'events_marocsoleil', 'reservations_marocsoleil', 
        'user_roles_marocsoleil', 'circuits_touristiques_marocsoleil', 'bookings_marocsoleil', 'annonces_marocsoleil', 
        'contact_messages_marocsoleil', 'site_settings_marocsoleil', 'partner_products_marocsoleil', 
        'favorites_marocsoleil', 'services_marocsoleil', 'bookings', 'payments', 'profiles'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix
    LOOP
        -- 1. Vérifier si la table existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name AND table_schema = 'public') THEN
            
            -- 2. Accorder les permissions de base
            EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres', t_name);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t_name);
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t_name);
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon', t_name);

            -- 3. Activer RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

            -- 4. Nettoyage des anciennes politiques
            EXECUTE format('DROP POLICY IF EXISTS "Public read access %s" ON public.%I', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Admin full access %s" ON public.%I', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %s" ON public.%I', t_name, t_name);
            
            -- 5. Lecture publique
            EXECUTE format('CREATE POLICY "Public read access %s" ON public.%I FOR SELECT USING (true)', t_name, t_name);

            -- 6. Accès Admin (Utilisation de la fonction pour éviter la récursion)
            EXECUTE format('CREATE POLICY "Admin full access %s" ON public.%I FOR ALL TO authenticated USING (public.check_is_admin_v4())', t_name, t_name);



            -- 7. Politiques de propriété (Own Data)
            -- Pour bookings_marocsoleil et bookings
            IF t_name LIKE 'bookings%' THEN
                EXECUTE format('CREATE POLICY "Users can manage own %s" ON public.%I FOR ALL TO authenticated USING (
                    auth.uid() = client_id OR auth.uid()::text = client_id::text
                )', t_name, t_name);
            END IF;

            -- Pour payments_marocsoleil et payments
            IF t_name LIKE 'payments%' THEN
                -- On essaie de lier au booking_id si la colonne existe
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'booking_id') THEN
                    -- On cherche la table de bookings correspondante
                    DECLARE
                        booking_table TEXT := CASE WHEN t_name LIKE '%\_marocsoleil' THEN 'bookings_marocsoleil' ELSE 'bookings' END;
                    BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = booking_table) THEN
                            EXECUTE format('CREATE POLICY "Users can manage own %s" ON public.%I FOR ALL TO authenticated USING (
                                EXISTS (SELECT 1 FROM %I WHERE id = %I.booking_id AND client_id = auth.uid())
                            )', t_name, t_name, booking_table, t_name);
                        END IF;
                    END;
                END IF;
            END IF;

            -- Pour profiles et profiles_marocsoleil
            IF t_name LIKE 'profiles%' THEN
                EXECUTE format('CREATE POLICY "Users can manage own %s" ON public.%I FOR ALL TO authenticated USING (auth.uid() = id)', t_name, t_name);
            END IF;

            RAISE NOTICE 'Permissions et RLS corrigés pour la table %', t_name;
        END IF;
    END LOOP;
END $$;

-- Correction des séquences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Vérification
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND (tablename LIKE '%_marocsoleil' OR tablename IN ('bookings', 'payments', 'profiles'));

-- ================================================================================
-- 4. AUTH TRIGGERS FOR PROFILES_MAROCSOLEIL
-- ================================================================================

-- Function for standard signup
CREATE OR REPLACE FUNCTION public.handle_new_user_marocsoleil()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles_marocsoleil (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user_oauth_marocsoleil()
RETURNS TRIGGER AS $$
DECLARE
    full_name_meta TEXT;
    f_name TEXT;
    l_name TEXT;
BEGIN
    full_name_meta := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    f_name := split_part(full_name_meta, ' ', 1);
    l_name := substring(full_name_meta from length(f_name) + 2);

    INSERT INTO public.profiles_marocsoleil (
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        is_verified,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        f_name,
        l_name,
        'client',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create triggers
DROP TRIGGER IF EXISTS on_auth_user_created_marocsoleil ON auth.users;
CREATE TRIGGER on_auth_user_created_marocsoleil
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_app_meta_data->>'provider' != 'google' OR NEW.raw_app_meta_data->>'provider' IS NULL)
    EXECUTE FUNCTION public.handle_new_user_marocsoleil();

DROP TRIGGER IF EXISTS on_auth_user_created_oauth_marocsoleil ON auth.users;
CREATE TRIGGER on_auth_user_created_oauth_marocsoleil
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_app_meta_data->>'provider' = 'google')
    EXECUTE FUNCTION public.handle_new_user_oauth_marocsoleil();

