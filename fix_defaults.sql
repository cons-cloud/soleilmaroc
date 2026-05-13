DO $$ 
DECLARE
    t_name text;
    marocsoleil_tables text[] := ARRAY[
        'annonces_marocsoleil', 'hotels_marocsoleil', 'villas_marocsoleil', 
        'appartements_marocsoleil', 'locations_voitures_marocsoleil', 
        'circuits_touristiques_marocsoleil', 'evenements_marocsoleil', 
        'restaurants_marocsoleil', 'activites_marocsoleil', 
        'partner_products_marocsoleil', 'services_marocsoleil'
    ];
BEGIN
    FOR t_name IN SELECT unnest(marocsoleil_tables) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id SET DEFAULT auth.uid();', t_name);
        EXCEPTION WHEN OTHERS THEN END;
        
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN partner_id SET DEFAULT auth.uid();', t_name);
        EXCEPTION WHEN OTHERS THEN END;
        
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN created_by SET DEFAULT auth.uid();', t_name);
        EXCEPTION WHEN OTHERS THEN END;
    END LOOP;
END $$;
