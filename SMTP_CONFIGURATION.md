# 📧 Configuration SMTP pour Supabase

## ⚠️ Important : Supabase SMTP vs Edge Functions

**Supabase SMTP** (Settings → Auth → SMTP) est utilisé **uniquement pour les emails d'authentification** (confirmation d'inscription, reset password, etc.).

Pour envoyer des **emails transactionnels** (confirmations de réservation), vous avez 2 options :

### Option 1 : Utiliser Gmail SMTP dans la fonction Edge (Recommandé)

Utiliser Gmail SMTP directement dans votre fonction Edge Function.

### Option 2 : Utiliser SendGrid/Mailgun SMTP

Utiliser un service professionnel avec meilleure délivrabilité.

---

## 🔧 Configuration SMTP Gmail (Option 1 - Gratuit)

### Étape 1 : Créer un mot de passe d'application Gmail

1. Aller sur https://myaccount.google.com/apppasswords
2. Se connecter avec votre compte Gmail
3. Sélectionner "Mail" et "Autre (nom personnalisé)"
4. Entrer : "Maroc Soleil Supabase"
5. Cliquer sur "Générer"
6. **Copier le mot de passe** (16 caractères)

### Étape 2 : Paramètres SMTP pour Supabase

Dans **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**, remplir :

```
✅ Enable Custom SMTP: OUI

Host: smtp.gmail.com
Port: 587
Username: votre-email@gmail.com
Password: [le mot de passe d'application de 16 caractères]
Sender name: Maroc Soleil
Sender email: votre-email@gmail.com
Reply-to: votre-email@gmail.com
```

### Étape 3 : Modifier la fonction Edge pour utiliser Gmail SMTP

La fonction edge doit être modifiée pour utiliser SMTP directement. Voir le fichier mis à jour ci-dessous.

---

## 🔧 Configuration SMTP SendGrid (Option 2 - Recommandé pour production)

### Étape 1 : Créer un compte SendGrid

1. Aller sur https://sendgrid.com
2. Créer un compte gratuit (100 emails/jour)
3. Vérifier votre email

### Étape 2 : Créer une clé API SendGrid

1. Aller dans **Settings** → **API Keys**
2. Cliquer sur **Create API Key**
3. Donner un nom : "Maroc Soleil"
4. Sélectionner **Full Access** ou **Mail Send**
5. **Copier la clé API**

### Étape 3 : Paramètres SMTP SendGrid

```
✅ Enable Custom SMTP: OUI

Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [votre clé API SendGrid]
Sender name: Maroc Soleil
Sender email: noreply@votredomaine.com (ou votre email vérifié)
Reply-to: contact@votredomaine.com
```

---

## 🔧 Configuration SMTP Mailgun (Option 3)

### Étape 1 : Créer un compte Mailgun

1. Aller sur https://www.mailgun.com
2. Créer un compte gratuit (5000 emails/mois pendant 3 mois)

### Étape 2 : Vérifier votre domaine ou utiliser le domaine sandbox

### Étape 3 : Paramètres SMTP Mailgun

```
✅ Enable Custom SMTP: OUI

Host: smtp.mailgun.org
Port: 587
Username: postmaster@votredomaine.mailgun.org
Password: [votre mot de passe SMTP Mailgun]
Sender name: Maroc Soleil
Sender email: noreply@votredomaine.com
Reply-to: contact@votredomaine.com
```

---

## 📝 Configuration dans Supabase Dashboard

### Navigation

1. Ouvrir votre projet Supabase
2. Aller dans **Settings** (⚙️ dans le menu gauche)
3. Cliquer sur **Auth**
4. Faire défiler jusqu'à **SMTP Settings**
5. Activer **Enable Custom SMTP**

### Remplir les champs

Copiez-collez les valeurs selon le service choisi ci-dessus.

### Tester la configuration

1. Cliquer sur **Send Test Email**
2. Entrer votre email de test
3. Cliquer sur **Send**
4. Vérifier votre boîte de réception

---

## ⚠️ Notes importantes

### Pour Gmail

- ✅ Gratuit et simple
- ⚠️ Limite de 500 emails/jour pour compte gratuit
- ⚠️ Risque de spam si volume élevé
- ⚠️ Nécessite mot de passe d'application (pas le mot de passe normal)

### Pour SendGrid

- ✅ Meilleure délivrabilité
- ✅ 100 emails/jour gratuits
- ✅ Statut des emails (ouvert, cliqué, etc.)
- ⚠️ Configuration DNS nécessaire pour domaine personnalisé

### Pour Mailgun

- ✅ 5000 emails/mois gratuits (3 premiers mois)
- ✅ Bonne délivrabilité
- ⚠️ Configuration DNS nécessaire

---

## 🔒 Sécurité

- ⚠️ Ne jamais partager vos mots de passe d'application
- ⚠️ Utiliser des mots de passe d'application, pas vos mots de passe principaux
- ✅ Activer l'authentification à deux facteurs sur Gmail si vous utilisez Gmail SMTP

---

## 📊 Comparaison rapide

| Service | Gratuit | Limite | Délivrabilité | Facilité |
|---------|---------|--------|---------------|----------|
| Gmail   | ✅ Oui   | 500/jour | ⚠️ Moyenne | ✅ Très facile |
| SendGrid| ✅ Oui   | 100/jour | ✅ Excellente | ✅ Facile |
| Mailgun | ✅ 3 mois| 5000/mois| ✅ Excellente | ⚠️ Moyenne |

---

## 🚀 Prochaines étapes

Après avoir configuré SMTP dans Supabase :

1. ✅ Tester l'envoi d'email de test
2. ✅ Modifier la fonction Edge pour utiliser SMTP directement (voir ci-dessous)
3. ✅ Déployer la fonction Edge
4. ✅ Tester une réservation complète

