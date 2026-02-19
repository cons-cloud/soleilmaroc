-- Création du bucket pour les annonces
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('annonces', 'annonces', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket des annonces
-- Tout le monde peut voir les images des annonces
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'annonces');

-- Les utilisateurs authentifiés peuvent téléverser des images
CREATE POLICY "Authenticated users can upload to annonces"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'annonces' AND
  auth.role() = 'authenticated'
);

-- Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own files in annonces"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'annonces' AND
  auth.uid() = owner
);

-- Les utilisateurs peuvent mettre à jour leurs propres images
CREATE POLICY "Users can update their own files in annonces"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'annonces' AND
  auth.uid() = owner
);
