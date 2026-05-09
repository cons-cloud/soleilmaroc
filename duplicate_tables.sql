-- Script de duplication des tables pour MarocSoleil
-- Suffixe: _marocsoleil

DO $$
DECLARE
    t_name TEXT;
    new_t_name TEXT;
    tables_to_dup TEXT[] := ARRAY[
        'appartements_marocsoleil', 'properties_marocsoleil', 'evenements_marocsoleil', 'site_content_marocsoleil', 
        'activites_touristiques_marocsoleil', 'locations_voitures_marocsoleil', 'categories_marocsoleil', 
        'payments_marocsoleil', 'reviews_marocsoleil', 'images_marocsoleil', 'profiles_marocsoleil', 'cars_marocsoleil', 'apartments_marocsoleil', 
        'villas_marocsoleil', 'hotels_marocsoleil', 'tourism_marocsoleil', 'events_marocsoleil', 'reservations_marocsoleil', 
        'user_roles_marocsoleil', 'circuits_touristiques_marocsoleil', 'bookings_marocsoleil', 'annonces_marocsoleil', 
        'contact_messages_marocsoleil', 'site_settings_marocsoleil', 'partner_products_marocsoleil', 
        'favorites_marocsoleil', 'services_marocsoleil'
    ];
    r RECORD;
    policy_cmd TEXT;
    trigger_cmd TEXT;
    fk_cmd TEXT;
    temp_qual TEXT;
    temp_check TEXT;
BEGIN
    -- 1. Dupliquer les tables (structure + données + index + contraintes par défaut)
    FOREACH t_name IN ARRAY tables_to_dup
    LOOP
        new_t_name := t_name || '_marocsoleil';
        
        -- Vérifier si la table existe déjà
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = new_t_name AND table_schema = 'public') THEN
            EXECUTE format('DROP TABLE public.%I CASCADE', new_t_name);
        END IF;

        -- Créer la nouvelle table comme l'ancienne
        EXECUTE format('CREATE TABLE public.%I (LIKE public.%I INCLUDING ALL)', new_t_name, t_name);
        
        -- Copier les données
        EXECUTE format('INSERT INTO public.%I SELECT * FROM public.%I', new_t_name, t_name);
        
        RAISE NOTICE 'Table % dupliquée en %', t_name, new_t_name;
    END LOOP;

    -- 2. Mettre à jour les clés étrangères dans les nouvelles tables
    -- On cherche les FK qui pointent vers les tables d'origine et on les redirige vers les nouvelles versions
    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            AND tc.table_name LIKE '%\_marocsoleil'
            AND ccu.table_name = ANY(tables_to_dup)
    LOOP
        fk_cmd := format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
        EXECUTE fk_cmd;
        
        fk_cmd := format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id)', 
            r.table_name, 
            r.constraint_name || '_new', 
            r.column_name, 
            r.foreign_table_name || '_marocsoleil'
        );
        EXECUTE fk_cmd;
        RAISE NOTICE 'Clé étrangère mise à jour pour %: % -> %', r.table_name, r.column_name, r.foreign_table_name || '_marocsoleil';
    END LOOP;

    -- 3. Dupliquer les politiques RLS
    FOR r IN 
        SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = ANY(tables_to_dup)
    LOOP
        new_t_name := r.tablename || '_marocsoleil';
        
        -- Construire la commande en fonction du type de commande (INSERT, SELECT, etc.)
        policy_cmd := format('CREATE POLICY %I ON public.%I FOR %s TO %s', 
            r.policyname || '_marocsoleil', 
            new_t_name, 
            r.cmd, 
            array_to_string(r.roles, ',')
        );

        IF r.qual IS NOT NULL THEN
            -- Remplacer les noms de tables dans l'expression USING avec des limites de mots
            temp_qual := r.qual;
            FOREACH t_name IN ARRAY tables_to_dup
            LOOP
                temp_qual := regexp_replace(temp_qual, '\b' || t_name || '\b', t_name || '_marocsoleil', 'g');
            END LOOP;
            policy_cmd := policy_cmd || format(' USING (%s)', temp_qual);
        END IF;

        IF r.with_check IS NOT NULL THEN
            -- Remplacer les noms de tables dans l'expression WITH CHECK avec des limites de mots
            temp_check := r.with_check;
            FOREACH t_name IN ARRAY tables_to_dup
            LOOP
                temp_check := regexp_replace(temp_check, '\b' || t_name || '\b', t_name || '_marocsoleil', 'g');
            END LOOP;
            policy_cmd := policy_cmd || format(' WITH CHECK (%s)', temp_check);
        END IF;
        
        -- Activer RLS sur la nouvelle table si ce n'est pas déjà fait
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', new_t_name);
        
        BEGIN
            EXECUTE policy_cmd;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la création de la politique % sur %: % (CMD: %)', r.policyname, new_t_name, SQLERRM, policy_cmd;
        END;
    END LOOP;

    -- 4. Dupliquer les triggers
    FOR r IN 
        SELECT 
            trig.tgname AS trigger_name,
            rel.relname AS table_name,
            n.nspname AS schema_name,
            pg_get_triggerdef(trig.oid) AS trigger_def
        FROM pg_trigger trig
        JOIN pg_class rel ON trig.tgrelid = rel.oid
        JOIN pg_namespace n ON rel.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND rel.relname = ANY(tables_to_dup)
          AND NOT trig.tgisinternal
    LOOP
        new_t_name := r.table_name || '_marocsoleil';
        
        -- Préparer la définition du trigger en remplaçant les noms de tables
        trigger_cmd := r.trigger_def;
        FOREACH t_name IN ARRAY tables_to_dup
        LOOP
            trigger_cmd := regexp_replace(trigger_cmd, '\b' || t_name || '\b', t_name || '_marocsoleil', 'g');
        END LOOP;
        
        -- On ajoute un suffixe au nom du trigger pour éviter les collisions si on est sur le même schéma
        trigger_cmd := replace(trigger_cmd, format('TRIGGER %I', r.trigger_name), format('TRIGGER %I', r.trigger_name || '_marocsoleil'));
        
        BEGIN
            EXECUTE trigger_cmd;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la création du trigger % sur %: % (CMD: %)', r.trigger_name, new_t_name, SQLERRM, trigger_cmd;
        END;
    END LOOP;

END $$;
