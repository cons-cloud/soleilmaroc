DO $$ 
DECLARE
    r RECORD;
    t_name text;
    policy_name text;
    marocsoleil_tables text[] := ARRAY[
        'annonces_marocsoleil', 'hotels_marocsoleil', 'villas_marocsoleil', 
        'appartements_marocsoleil', 'locations_voitures_marocsoleil', 
        'circuits_touristiques_marocsoleil', 'evenements_marocsoleil', 
        'restaurants_marocsoleil', 'activites_marocsoleil', 
        'partner_products_marocsoleil', 'services_marocsoleil'
    ];
BEGIN
    -- 1. Drop all bad policies querying auth.users from marocsoleil tables
    FOR t_name IN SELECT unnest(marocsoleil_tables) LOOP
        FOR r IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = t_name 
            AND (qual LIKE '%auth.users%' OR qual LIKE '%users.raw_%' OR qual LIKE '%users.id%')
        LOOP
            policy_name := r.policyname;
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', policy_name, t_name);
            RAISE NOTICE 'Dropped policy % on table %', policy_name, t_name;
        END LOOP;
        
        -- 2. Create one correct robust Admin Policy relying on public.profiles
        -- Drop if exists just in case
        EXECUTE format('DROP POLICY IF EXISTS "Admins can do everything %s" ON %I;', t_name, t_name);
        EXECUTE format('CREATE POLICY "Admins can do everything %s" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''));', t_name, t_name);
        RAISE NOTICE 'Created universal admin policy on table %', t_name;
    END LOOP;
END $$;
