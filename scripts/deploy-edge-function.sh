#!/bin/bash

# Script de déploiement de la fonction Edge send-booking-confirmation
# Usage: ./scripts/deploy-edge-function.sh

set -e

echo "🚀 Déploiement de la fonction Edge send-booking-confirmation..."
echo ""

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Nom de la fonction
FUNCTION_NAME="send-booking-confirmation"

# Vérifier si on est dans le bon répertoire
if [ ! -d "supabase/functions/$FUNCTION_NAME" ]; then
    echo "❌ Le dossier supabase/functions/$FUNCTION_NAME n'existe pas."
    exit 1
fi

# Vérifier si le projet est lié
echo "📋 Vérification de la liaison du projet..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Vous devez vous connecter à Supabase."
    supabase login
fi

# Déployer la fonction
echo "📤 Déploiement de la fonction $FUNCTION_NAME..."
supabase functions deploy $FUNCTION_NAME

echo ""
echo "✅ Fonction déployée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Définir les secrets dans Supabase Dashboard → Settings → Edge Functions → Secrets"
echo "   - RESEND_API_KEY=votre_clé_api"
echo "   - RESEND_FROM_EMAIL=Maroc Soleil <noreply@votredomaine.com>"
echo ""
echo "2. Ou via CLI:"
echo "   supabase secrets set RESEND_API_KEY=votre_clé_api"
echo "   supabase secrets set RESEND_FROM_EMAIL='Maroc Soleil <noreply@votredomaine.com>'"
echo ""
echo "📚 Pour plus d'informations, consultez:"
echo "   supabase/functions/send-booking-confirmation/README.md"

