#!/bin/bash

# Script pour appliquer les migrations nécessaires pour la fonctionnalité des annonces

echo "Application des migrations pour les annonces..."

# Exécuter les migrations
psql $DATABASE_URL -f supabase/migrations/20250215173300_create_favorites_table.sql
echo "✅ Table des favoris créée avec succès"

psql $DATABASE_URL -f supabase/migrations/20250215173400_update_annonces_rls.sql
echo "✅ Politiques RLS pour les annonces mises à jour avec succès"

psql $DATABASE_URL -f supabase/migrations/20250215173500_add_annonces_storage.sql
echo "✅ Configuration du stockage pour les annonces terminée"

psql $DATABASE_URL -f supabase/migrations/20250215173600_add_user_id_to_annonces.sql
echo "✅ Colonne user_id ajoutée à la table annonces"

echo "✅ Toutes les migrations ont été appliquées avec succès !"
