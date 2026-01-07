# 📧 Fonction Edge : send-booking-confirmation

Cette fonction Supabase Edge Function envoie automatiquement des emails de confirmation après chaque réservation réussie.

## 🔧 Configuration

### Option 1 : Utiliser Resend (Recommandé)

1. Créer un compte sur [Resend](https://resend.com) (gratuit jusqu'à 3000 emails/mois)

2. Créer une API Key :
   - Aller dans **API Keys** → **Create API Key**
   - Donner un nom (ex: "Maroc Soleil Production")
   - Copier la clé API

3. Configurer le domaine d'envoi :
   - Aller dans **Domains** → **Add Domain**
   - Suivre les instructions DNS pour vérifier votre domaine
   - Ou utiliser le domaine par défaut de Resend pour les tests

4. Définir les variables d'environnement dans Supabase :
   ```bash
   # Dans Supabase Dashboard → Settings → Edge Functions → Secrets
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=Maroc Soleil <noreply@votredomaine.com>
   ```

## 📝 Note importante

Cette fonction utilise uniquement **Resend** pour l'envoi d'emails. Assurez-vous de configurer `RESEND_API_KEY` dans les secrets Supabase.

## 🚀 Déploiement

### Avec Supabase CLI

```bash
# Installer Supabase CLI (si pas déjà installé)
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local à votre projet Supabase
supabase link --project-ref votre-project-ref

# Déployer la fonction
supabase functions deploy send-booking-confirmation

# Définir les secrets
supabase secrets set RESEND_API_KEY=votre_clé_api
supabase secrets set RESEND_FROM_EMAIL="Maroc Soleil <noreply@votredomaine.com>"
```

### Via Supabase Dashboard

1. Aller dans **Edge Functions** → **Create a new function**
2. Nommer la fonction : `send-booking-confirmation`
3. Coller le code de `index.ts`
4. Cliquer sur **Deploy**
5. Aller dans **Settings** → **Edge Functions** → **Secrets** pour ajouter les variables d'environnement

## 🧪 Tester la fonction

```bash
curl -X POST https://votre-project-ref.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "paymentId": "pay-123",
    "customerEmail": "test@example.com",
    "customerName": "Test User",
    "serviceTitle": "Hôtel Luxury Casablanca",
    "totalPrice": 2500,
    "serviceType": "hotel",
    "startDate": "2024-12-20",
    "endDate": "2024-12-25",
    "transactionId": "txn_123456789"
  }'
```

## 📋 Paramètres attendus

```typescript
{
  bookingId: string;        // ID de la réservation
  paymentId: string;        // ID du paiement
  customerEmail: string;    // Email du client (requis)
  customerName: string;     // Nom du client (requis)
  serviceTitle: string;     // Titre du service (requis)
  totalPrice: number;       // Montant total en MAD
  serviceType: string;      // Type: hotel, appartement, villa, voiture, circuit
  startDate?: string;       // Date de début (optionnel)
  endDate?: string;         // Date de fin (optionnel)
  transactionId?: string;   // ID de transaction (optionnel)
}
```

## ✅ Réponse de succès

```json
{
  "success": true,
  "message": "Email envoyé avec succès",
  "bookingId": "xxx",
  "customerEmail": "client@example.com"
}
```

## ❌ Réponse d'erreur

```json
{
  "error": "Message d'erreur",
  "details": "Détails de l'erreur"
}
```

## 🔒 Sécurité

- La fonction utilise les variables d'environnement pour les clés API
- Les emails sont envoyés uniquement avec validation des paramètres
- CORS est configuré pour autoriser les requêtes depuis votre domaine

## 📝 Notes

- Si l'envoi d'email échoue, la fonction retourne un warning mais ne bloque pas le processus de réservation
- Les erreurs sont loggées dans les logs Supabase
- L'email HTML est responsive et fonctionne sur tous les clients email
- Si `RESEND_API_KEY` n'est pas configuré, la fonction log un warning mais continue (réservation créée quand même)
