// supabase/functions/send-booking-confirmation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailParams {
  bookingId: string;
  paymentId: string;
  customerEmail: string;
  customerName: string;
  serviceTitle: string;
  totalPrice: number;
  serviceType: string;
  startDate: string;
  endDate: string;
  transactionId: string;
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
    }: EmailParams = await req.json()

    // Validation des paramètres requis
    if (!customerEmail || !customerName || !serviceTitle) {
      return new Response(
        JSON.stringify({ error: 'Paramètres requis manquants' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Formater les dates
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Non spécifié'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      } catch {
        return dateString
      }
    }

    // Formater le type de service
    const formatServiceType = (type: string) => {
      const types: Record<string, string> = {
        'hotel': 'Hôtel',
        'appartement': 'Appartement',
        'villa': 'Villa',
        'voiture': 'Voiture de location',
        'circuit': 'Circuit touristique',
        'hebergement': 'Hébergement'
      }
      return types[type] || type
    }

    // Template d'email HTML amélioré
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de réservation</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 30px 20px; 
            background-color: #ffffff;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #111827;
          }
          .details { 
            background-color: #f9fafb; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            border-left: 4px solid #10b981;
          }
          .details h3 {
            margin-top: 0;
            color: #111827;
            font-size: 20px;
            margin-bottom: 15px;
          }
          .detail-row {
            margin: 12px 0;
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
            text-align: right;
          }
          .highlight {
            color: #10b981;
            font-weight: 600;
            font-size: 18px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 12px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Réservation Confirmée</h1>
          </div>
          <div class="content">
            <p class="greeting">Bonjour ${customerName},</p>
            <p>Nous sommes ravis de vous confirmer que votre réservation a été enregistrée avec succès !</p>
            
            <div class="details">
              <h3>📋 Détails de votre réservation</h3>
              <div class="detail-row">
                <span class="detail-label">Service :</span>
                <span class="detail-value">${serviceTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type :</span>
                <span class="detail-value">${formatServiceType(serviceType)}</span>
              </div>
              ${startDate ? `
              <div class="detail-row">
                <span class="detail-label">Date de début :</span>
                <span class="detail-value">${formatDate(startDate)}</span>
              </div>
              ` : ''}
              ${endDate ? `
              <div class="detail-row">
                <span class="detail-label">Date de fin :</span>
                <span class="detail-value">${formatDate(endDate)}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Montant total :</span>
                <span class="detail-value highlight">${totalPrice.toLocaleString('fr-FR')} MAD</span>
              </div>
              ${transactionId ? `
              <div class="detail-row">
                <span class="detail-label">N° de transaction :</span>
                <span class="detail-value">${transactionId}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">N° de réservation :</span>
                <span class="detail-value"><strong>${bookingId}</strong></span>
              </div>
            </div>
            
            <p>Un email de confirmation détaillé vous sera envoyé sous peu avec toutes les informations nécessaires pour votre séjour.</p>
            
            <p style="margin-top: 30px;">Merci de votre confiance et à très bientôt !</p>
            <p><strong>L'équipe Maroc Soleil</strong></p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>Pour toute question, contactez-nous via notre site web.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoyer l'email via Resend (recommandé)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      // Option 1: Utiliser Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'Maroc Soleil <noreply@marocsoleil.com>',
          to: customerEmail,
          subject: `Confirmation de réservation - ${serviceTitle}`,
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.json()
        console.error('Erreur Resend:', error)
        throw new Error(`Erreur Resend: ${JSON.stringify(error)}`)
      }

      const result = await resendResponse.json()
      console.log('Email envoyé via Resend:', result)
    } else {
      // Si Resend n'est pas configuré, on log l'erreur mais on ne bloque pas
      console.warn('⚠️ RESEND_API_KEY non configuré. Email non envoyé mais réservation créée.')
      console.log('Email qui aurait dû être envoyé:', {
        to: customerEmail,
        subject: `Confirmation de réservation - ${serviceTitle}`,
        bookingId
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès',
        bookingId,
        customerEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Erreur dans send-booking-confirmation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

