-- Ajouter la colonne user_id à la table annonces si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'annonces' 
                 AND column_name = 'user_id') THEN
    ALTER TABLE public.annonces ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Mettre à jour les enregistrements existants avec l'ID de l'utilisateur créateur
    UPDATE public.annonces SET user_id = created_by WHERE user_id IS NULL;
    
    -- Créer un index sur user_id pour les performances
    CREATE INDEX IF NOT EXISTS idx_annonces_user_id ON public.annonces(user_id);
    
    -- Mettre à jour les politiques RLS si nécessaire
    DROP POLICY IF EXISTS "Propriétaires peuvent gérer leurs annonces" ON public.annonces;
    
    CREATE POLICY "Propriétaires peuvent gérer leurs annonces"
    ON public.annonces
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Colonne user_id ajoutée à la table annonces avec succès';
  ELSE
    RAISE NOTICE 'La colonne user_id existe déjà dans la table annonces';
  END IF;
END $$;
