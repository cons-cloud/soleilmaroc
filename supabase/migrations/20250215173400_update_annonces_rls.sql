-- Politiques RLS pour la table annonces
-- Supprimer les politiques existantes si elles existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annonces') THEN
    DROP POLICY IF EXISTS "Tout le monde peut voir les annonces disponibles" ON public.annonces;
    DROP POLICY IF EXISTS "Propriétaires peuvent gérer leurs annonces" ON public.annonces;
    DROP POLICY IF EXISTS "Accès administrateur complet aux annonces" ON public.annonces;
  END IF;
END $$;

-- Tout le monde peut voir les annonces disponibles
CREATE POLICY "Tout le monde peut voir les annonces disponibles" 
ON public.annonces 
FOR SELECT 
USING (available = true);

-- Les propriétaires peuvent gérer leurs propres annonces
CREATE POLICY "Propriétaires peuvent gérer leurs annonces"
ON public.annonces
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Les administrateurs peuvent tout faire
CREATE POLICY "Accès administrateur complet aux annonces"
ON public.annonces
FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
))
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
));
