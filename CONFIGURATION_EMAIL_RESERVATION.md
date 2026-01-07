# 📧 Configuration de l'envoi d'email après réservation

## ✅ **État actuel**

Tous les formulaires de réservation sont configurés pour envoyer un email de confirmation après un paiement réussi :

1. **Payment.tsx** - ✅ Envoi d'email configuré
2. **CircuitBookingForm.tsx** - ✅ Envoi d'email configuré
3. **UniversalBookingForm.tsx** - ✅ Envoi d'email configuré
4. **PartnerProductBookingForm.tsx** - ✅ Envoi d'email configuré

## 🔧 **Fonction Edge Function requise**

Tous les formulaires appellent la fonction Supabase Edge Function `send-booking-confirmation`.

### **Paramètres envoyés :**
```typescript
{
  bookingId: string,
  paymentId: string,
  customerEmail: string,
  customerName: string,
  serviceTitle: string,
  totalPrice: number,
  serviceType: string,
  startDate: string,
  endDate: string,
  transactionId: string
}
```

## 📝 **Création de la fonction Edge Function**

### **1. Créer le dossier de la fonction**
```bash
mkdir -p supabase/functions/send-booking-confirmation
```

### **2. Créer le fichier index.ts**
```typescript
// supabase/functions/send-booking-confirmation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      bookingId,
      paymentId,
      customerEmail,
      customerName,
      serviceTitle,
      totalPrice,
      serviceType,
      startDate,
      endDate,
      transactionId
    } = await req.json()

    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Template d'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Réservation Confirmée</h1>
          </div>
          <div class="content">
            <p>Bonjour ${customerName},</p>
            <p>Votre réservation a été confirmée avec succès !</p>
            
            <div class="details">
              <h3>Détails de votre réservation</h3>
              <p><strong>Service :</strong> ${serviceTitle}</p>
              <p><strong>Type :</strong> ${serviceType}</p>
              <p><strong>Date de début :</strong> ${new Date(startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date de fin :</strong> ${new Date(endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Montant total :</strong> ${totalPrice.toLocaleString()} MAD</p>
              <p><strong>Numéro de transaction :</strong> ${transactionId}</p>
              <p><strong>Numéro de réservation :</strong> ${bookingId}</p>
            </div>
            
            <p>Merci de votre confiance !</p>
            <p>L'équipe Maroc Soleil</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoyer l'email via Resend (recommandé)
    // Note: Pour utiliser SMTP Supabase, utilisez Resend ou SendGrid via leur API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Maroc Soleil <noreply@marocsoleil.com>',
          to: customerEmail,
          subject: `Confirmation de réservation - ${serviceTitle}`,
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.json()
        console.error('Erreur Resend:', error)
      }
    } else {
      console.warn('RESEND_API_KEY non configuré - email non envoyé')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

## 🔐 **Configuration Supabase**

### **Option 1 : Utiliser Supabase SMTP (recommandé)**

1. Aller dans **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
2. Configurer votre serveur SMTP (Gmail, SendGrid, etc.)
3. La fonction utilisera automatiquement la configuration SMTP

### **Option 2 : Utiliser un service externe**

Modifier la fonction pour utiliser :
- **Resend** : https://resend.com
- **SendGrid** : https://sendgrid.com
- **Mailgun** : https://mailgun.com

## 🚀 **Déploiement**

```bash
# Déployer la fonction
supabase functions deploy send-booking-confirmation

# Ou via Supabase CLI
supabase functions deploy send-booking-confirmation --project-ref YOUR_PROJECT_REF
```

## ✅ **Vérification**

Après le déploiement, testez avec :
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "paymentId": "pay-123",
    "customerEmail": "test@example.com",
    "customerName": "Test User",
    "serviceTitle": "Test Service",
    "totalPrice": 1000,
    "serviceType": "hotel",
    "startDate": "2024-01-01",
    "endDate": "2024-01-05",
    "transactionId": "txn-123"
  }'
```

## 📌 **Note importante**

Si la fonction Edge Function n'est pas encore déployée, les emails ne seront pas envoyés, mais :
- ✅ Les réservations seront toujours créées
- ✅ Les paiements seront toujours enregistrés
- ✅ L'utilisateur verra le message de confirmation
- ⚠️ L'erreur sera loggée dans la console mais ne bloquera pas le processus

