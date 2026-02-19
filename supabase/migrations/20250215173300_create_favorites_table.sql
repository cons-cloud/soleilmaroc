-- Création de la table favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  annonce_id UUID REFERENCES public.annonces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, annonce_id)
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Les utilisateurs peuvent voir leurs propres favoris
CREATE POLICY "Les utilisateurs peuvent voir leurs favoris" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent ajouter des favoris
CREATE POLICY "Les utilisateurs peuvent ajouter des favoris"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs favoris
CREATE POLICY "Les utilisateurs peuvent supprimer leurs favoris"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Les administrateurs peuvent tout faire
CREATE POLICY "Accès administrateur complet aux favoris"
ON public.favorites
FOR ALL
USING (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
))
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
));
