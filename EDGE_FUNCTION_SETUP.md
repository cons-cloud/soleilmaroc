# 🚀 Configuration de la Fonction Edge : send-booking-confirmation

## 📋 Vue d'ensemble

Cette fonction Supabase Edge Function envoie automatiquement des emails de confirmation après chaque réservation réussie. Elle est appelée depuis :

- `UniversalBookingForm.tsx`
- `PartnerProductBookingForm.tsx`
- `CircuitBookingForm.tsx`
- `Payment.tsx`

## ✅ État actuel

✅ **Fonction créée** : `supabase/functions/send-booking-confirmation/`

✅ **Code prêt** : La fonction utilise uniquement Resend pour l'envoi d'emails

⏳ **À configurer** : Variables d'environnement et déploiement

## 🔧 Configuration rapide

### Étape 1 : Créer un compte Resend (5 minutes)

1. Aller sur https://resend.com
2. Créer un compte (gratuit jusqu'à 3000 emails/mois)
3. Vérifier votre email

### Étape 2 : Obtenir la clé API

1. Aller dans **API Keys** → **Create API Key**
2. Donner un nom (ex: "Maroc Soleil Production")
3. **Copier la clé API** (elle ne s'affichera qu'une seule fois!)

### Étape 3 : Configurer le domaine d'envoi

**Option A : Utiliser le domaine de test Resend** (pour les tests)
- Pas de configuration nécessaire
- Les emails auront un en-tête "via Resend"

**Option B : Utiliser votre propre domaine** (recommandé pour la production)
1. Aller dans **Domains** → **Add Domain**
2. Ajouter votre domaine (ex: `marocsoleil.com`)
3. Suivre les instructions pour ajouter les enregistrements DNS
4. Attendre la vérification (généralement quelques minutes)

### Étape 4 : Déployer la fonction

#### Méthode 1 : Via Supabase Dashboard (Recommandé pour débutants)

1. Aller dans votre projet Supabase → **Edge Functions**
2. Cliquer sur **Create a new function**
3. Nommer : `send-booking-confirmation`
4. Coller le contenu de `supabase/functions/send-booking-confirmation/index.ts`
5. Cliquer sur **Deploy**

#### Méthode 2 : Via Supabase CLI

```bash
# Installer Supabase CLI (si pas déjà installé)
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Déployer
supabase functions deploy send-booking-confirmation

# Ou utiliser le script
./scripts/deploy-edge-function.sh
```

### Étape 5 : Configurer les secrets

#### Via Supabase Dashboard

1. Aller dans **Settings** → **Edge Functions** → **Secrets**
2. Ajouter les secrets suivants :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Maroc Soleil <noreply@marocsoleil.com>
```

**Note** : Pour le domaine de test Resend, utilisez :
```
RESEND_FROM_EMAIL=Maroc Soleil <onboarding@resend.dev>
```

#### Via CLI

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL="Maroc Soleil <noreply@marocsoleil.com>"
```

## 🧪 Tester la fonction

### Méthode 1 : Via curl

```bash
curl -X POST https://VOTRE_PROJECT_REF.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "paymentId": "pay-123",
    "customerEmail": "votre-email@example.com",
    "customerName": "Test User",
    "serviceTitle": "Hôtel Luxury Casablanca",
    "totalPrice": 2500,
    "serviceType": "hotel",
    "startDate": "2024-12-20",
    "endDate": "2024-12-25",
    "transactionId": "txn_123456789"
  }'
```

### Méthode 2 : Via le Dashboard Supabase

1. Aller dans **Edge Functions** → `send-booking-confirmation`
2. Cliquer sur **Invoke Function**
3. Coller le JSON de test ci-dessus
4. Cliquer sur **Invoke**

## ✅ Vérification

Après le déploiement, vous devriez :

1. ✅ Recevoir l'email de test à l'adresse spécifiée
2. ✅ Voir les logs dans Supabase Dashboard → Edge Functions → Logs
3. ✅ Voir les emails envoyés dans Resend Dashboard → Emails

## 🔍 Dépannage

### L'email n'est pas envoyé

1. **Vérifier les secrets** :
   - Les secrets sont bien définis dans Supabase
   - La clé API Resend est correcte

2. **Vérifier les logs** :
   - Supabase Dashboard → Edge Functions → Logs
   - Chercher les erreurs

3. **Vérifier le domaine Resend** :
   - Si vous utilisez votre domaine, vérifiez qu'il est bien vérifié
   - Pour les tests, utilisez `onboarding@resend.dev`

### Erreur CORS

La fonction gère automatiquement CORS. Si vous avez des erreurs :
- Vérifier que l'URL de votre application est autorisée
- Vérifier les headers de la requête

### Erreur "Function not found"

- Vérifier que la fonction est bien déployée
- Vérifier le nom de la fonction (doit être exactement `send-booking-confirmation`)
- Vérifier que vous utilisez la bonne URL du projet

## 📊 Monitoring

### Voir les logs

```bash
supabase functions logs send-booking-confirmation
```

### Dans Resend Dashboard

- Aller dans **Emails** pour voir tous les emails envoyés
- Voir les statistiques de délivrabilité
- Voir les erreurs d'envoi

## 🔐 Sécurité

- ✅ La fonction utilise `SUPABASE_SERVICE_ROLE_KEY` pour l'authentification
- ✅ Les paramètres sont validés avant l'envoi
- ✅ CORS est configuré pour votre domaine
- ✅ Les secrets sont stockés de manière sécurisée dans Supabase

## 💰 Coûts

### Resend
- **Gratuit** : 3000 emails/mois
- **Pro** : $20/mois pour 50,000 emails
- Plus d'infos : https://resend.com/pricing

### Supabase Edge Functions
- **Gratuit** : 500,000 invocations/mois
- Plus d'infos : https://supabase.com/pricing

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation Resend](https://resend.com/docs)
- [README de la fonction](./supabase/functions/send-booking-confirmation/README.md)

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs dans Supabase Dashboard
2. Vérifier les emails dans Resend Dashboard
3. Consulter la documentation ci-dessus
4. Vérifier que tous les secrets sont bien configurés

