# Guide de Configuration Stripe Production

## 🎯 Objectif
Configurer Stripe pour accepter de vrais paiements par carte bancaire sur votre site Maroc 2030.

## 📝 Étape 1 : Créer un compte Stripe

### 1.1 Inscription
1. Allez sur : https://dashboard.stripe.com/register
2. Créez un compte avec :
   - Email professionnel
   - Mot de passe sécurisé
   - Informations de votre entreprise

### 1.2 Vérification d'identité
Stripe vous demandera :
- ✅ Informations sur votre entreprise
- ✅ Numéro d'identification fiscale (ICE au Maroc)
- ✅ Coordonnées bancaires pour recevoir les paiements
- ✅ Pièce d'identité du représentant légal

**⚠️ Important pour le Maroc :**
- Stripe est disponible au Maroc depuis 2023
- Vous aurez besoin d'un compte bancaire marocain
- Les paiements seront en MAD (Dirham marocain)

---

## 🔑 Étape 2 : Récupérer vos clés API

### 2.1 Accéder aux clés
1. Connectez-vous à : https://dashboard.stripe.com
2. Allez dans **Développeurs** → **Clés API**
3. Vous verrez deux types de clés :

#### Mode Test (pour développement)
- **Clé publique test** : `pk_test_...`
- **Clé secrète test** : `sk_test_...`

#### Mode Production (pour vrais paiements)
- **Clé publique production** : `pk_live_...`
- **Clé secrète production** : `sk_live_...`

### 2.2 Sécurité des clés
- ✅ **Clé publique** : Peut être dans le code frontend
- ❌ **Clé secrète** : NE JAMAIS exposer dans le frontend
- 🔒 Stockez la clé secrète dans les variables d'environnement

---

## ⚙️ Étape 3 : Configuration du projet

### 3.1 Variables d'environnement

Créez/modifiez le fichier `.env` à la racine du projet :

```env
# Stripe - Mode Production
VITE_STRIPE_PUBLIC_KEY=pk_live_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE_ICI

# Stripe - Mode Test (pour développement)
# VITE_STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_TEST_ICI
# STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_TEST_ICI
```

### 3.2 Sécurité du fichier .env

Vérifiez que `.env` est dans `.gitignore` :

```gitignore
# Variables d'environnement
.env
.env.local
.env.production
```

---

## 🏦 Étape 4 : Configuration du compte bancaire

### 4.1 Ajouter un compte bancaire
1. Dans Stripe Dashboard → **Paramètres** → **Coordonnées bancaires**
2. Ajoutez votre compte bancaire marocain :
   - Nom de la banque
   - IBAN
   - Code SWIFT/BIC
   - Nom du titulaire du compte

### 4.2 Vérification
- Stripe effectuera un micro-dépôt pour vérifier le compte
- Cela peut prendre 1-3 jours ouvrables

---

## 💳 Étape 5 : Configuration des méthodes de paiement

### 5.1 Activer les cartes bancaires
Dans Stripe Dashboard → **Paramètres** → **Méthodes de paiement** :

Activez :
- ✅ Visa
- ✅ Mastercard
- ✅ American Express
- ✅ Cartes de débit
- ✅ Cartes marocaines (CMI)

### 5.2 Configurer 3D Secure
- Activez l'authentification forte (SCA)
- Obligatoire pour les paiements en Europe et recommandé au Maroc
- Réduit les fraudes et les contestations

---

## 🔔 Étape 6 : Webhooks (Important !)

Les webhooks permettent à Stripe de notifier votre serveur des événements de paiement.

### 6.1 Créer un endpoint webhook
1. Dashboard Stripe → **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. URL : `https://votre-domaine.com/api/stripe-webhook`

### 6.2 Événements à écouter
Sélectionnez ces événements :
- ✅ `payment_intent.succeeded` - Paiement réussi
- ✅ `payment_intent.payment_failed` - Paiement échoué
- ✅ `charge.refunded` - Remboursement effectué
- ✅ `checkout.session.completed` - Session complétée

### 6.3 Secret de signature
- Copiez le **Secret de signature du webhook** : `whsec_...`
- Ajoutez-le dans `.env` :
```env
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
```

---

## 📊 Étape 7 : Configuration des taxes et devises

### 7.1 Devise
- Devise principale : **MAD** (Dirham marocain)
- Configurez dans : Paramètres → Devise par défaut

### 7.2 Taxes (TVA au Maroc)
- TVA standard : 20%
- Configurez dans : Paramètres → Taxes
- Stripe peut calculer automatiquement la TVA

---

## 🧪 Étape 8 : Tests avant production

### 8.1 Cartes de test Stripe
En mode test, utilisez ces cartes :

**Paiement réussi :**
- Numéro : `4242 4242 4242 4242`
- Date : N'importe quelle date future
- CVC : N'importe quel 3 chiffres

**Paiement refusé :**
- Numéro : `4000 0000 0000 0002`

**3D Secure requis :**
- Numéro : `4000 0027 6000 3184`

### 8.2 Scénarios à tester
- ✅ Réservation simple
- ✅ Paiement avec 3D Secure
- ✅ Paiement refusé
- ✅ Remboursement
- ✅ Email de confirmation

---

## 🚀 Étape 9 : Passage en production

### 9.1 Checklist avant le lancement
- [ ] Compte Stripe vérifié et activé
- [ ] Compte bancaire ajouté et vérifié
- [ ] Clés de production configurées dans `.env`
- [ ] Webhooks configurés
- [ ] Tests effectués en mode test
- [ ] SSL/HTTPS activé sur votre site
- [ ] Politique de confidentialité et CGV à jour

### 9.2 Activer le mode production
1. Dans votre code, assurez-vous d'utiliser les clés de production
2. Déployez votre application
3. Testez avec une vraie carte (petit montant)
4. Vérifiez que le paiement apparaît dans Stripe Dashboard

---

## 💰 Étape 10 : Frais et tarification Stripe

### Tarifs Stripe au Maroc (2024)
- **Cartes européennes** : 1,4% + 2,50 MAD par transaction
- **Cartes marocaines** : 2,9% + 2,50 MAD par transaction
- **Pas de frais d'abonnement mensuel**
- **Pas de frais cachés**

### Virements vers votre compte
- Automatiques tous les 2-7 jours
- Gratuits vers votre compte bancaire marocain

---

## 📧 Étape 11 : Emails et notifications

### 11.1 Configurer les emails Stripe
Dashboard → **Paramètres** → **Emails** :
- ✅ Reçus de paiement
- ✅ Notifications de remboursement
- ✅ Alertes de fraude

### 11.2 Personnaliser les emails
- Ajoutez votre logo
- Personnalisez les couleurs
- Ajoutez vos coordonnées

---

## 🛡️ Étape 12 : Sécurité et conformité

### 12.1 Stripe Radar (anti-fraude)
- Activé automatiquement
- Analyse chaque transaction
- Bloque les paiements suspects

### 12.2 Conformité RGPD
- Stripe est conforme RGPD
- Données chiffrées
- Politique de confidentialité à jour

### 12.3 Certificat SSL
- Obligatoire pour accepter les paiements
- Utilisez Let's Encrypt (gratuit) ou un certificat payant

---

## 📱 Étape 13 : Support et ressources

### Documentation Stripe
- Guide officiel : https://stripe.com/docs
- API Reference : https://stripe.com/docs/api
- Support : https://support.stripe.com

### Support Maroc
- Email : support@stripe.com
- Chat en direct dans le Dashboard
- Documentation en français disponible

---

## ✅ Checklist finale

Avant d'accepter des paiements réels :

- [ ] Compte Stripe activé et vérifié
- [ ] Compte bancaire marocain configuré
- [ ] Clés de production dans `.env`
- [ ] Webhooks configurés et testés
- [ ] SSL/HTTPS activé
- [ ] Tests effectués en mode test
- [ ] Politique de confidentialité publiée
- [ ] CGV (Conditions Générales de Vente) publiées
- [ ] Mentions légales à jour
- [ ] Support client configuré

---

## 🆘 Problèmes courants

### Paiement refusé
- Vérifiez que la carte a des fonds suffisants
- Vérifiez que 3D Secure est activé
- Contactez la banque du client

### Webhook ne fonctionne pas
- Vérifiez l'URL du webhook
- Vérifiez le secret de signature
- Testez avec l'outil de test Stripe

### Virement non reçu
- Vérifiez les coordonnées bancaires
- Les virements prennent 2-7 jours
- Contactez le support Stripe

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Consultez la documentation Stripe
2. Contactez le support Stripe (chat 24/7)
3. Vérifiez les logs dans Stripe Dashboard

---

**Dernière mise à jour** : Novembre 2024
**Version** : 1.0
