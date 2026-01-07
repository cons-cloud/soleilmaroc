# 📧 Configuration Email - Réservations

## ✅ Configuration actuelle

La fonction Edge `send-booking-confirmation` utilise **uniquement Resend** pour envoyer les emails de confirmation après chaque réservation.

## 🔧 Configuration Resend

### Étape 1 : Créer un compte Resend

1. Aller sur https://resend.com
2. Créer un compte (gratuit jusqu'à 3000 emails/mois)
3. Vérifier votre email

### Étape 2 : Obtenir la clé API

1. Aller dans **API Keys** → **Create API Key**
2. Donner un nom (ex: "Maroc Soleil Production")
3. **Copier la clé API** (elle ne s'affichera qu'une seule fois!)

### Étape 3 : Configurer le domaine (optionnel)

**Pour les tests** : Vous pouvez utiliser le domaine par défaut de Resend

**Pour la production** :
1. Aller dans **Domains** → **Add Domain**
2. Ajouter votre domaine (ex: `marocsoleil.com`)
3. Suivre les instructions pour ajouter les enregistrements DNS
4. Attendre la vérification

### Étape 4 : Déployer la fonction Edge

Voir `EDGE_FUNCTION_SETUP.md` pour les instructions complètes.

### Étape 5 : Configurer les secrets

Dans Supabase Dashboard → Settings → Edge Functions → Secrets :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Maroc Soleil <noreply@votredomaine.com>
```

## 📝 Note

- Les emails sont envoyés automatiquement en arrière-plan
- Si Resend n'est pas configuré, l'email ne sera pas envoyé mais la réservation sera quand même créée
- Aucun message visible n'informe l'utilisateur de l'envoi d'email

## 📚 Documentation complète

Voir `EDGE_FUNCTION_SETUP.md` pour le guide complet de déploiement.

