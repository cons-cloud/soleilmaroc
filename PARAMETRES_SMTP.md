# 📧 Paramètres SMTP à mettre dans Supabase

## ⚙️ Où configurer dans Supabase

**Navigation :**
1. Supabase Dashboard → **Settings** (⚙️ menu gauche)
2. **Auth** 
3. Faire défiler jusqu'à **SMTP Settings**
4. Activer **"Enable Custom SMTP"**

---

## 🟢 Option 1 : Gmail SMTP (Recommandé pour débuter)

### Paramètres à copier-coller :

```
✅ Enable Custom SMTP: OUI

Host: smtp.gmail.com
Port: 587
Username: votre-email@gmail.com
Password: [Voir instructions ci-dessous pour obtenir le mot de passe]
Sender name: Maroc Soleil
Sender email: votre-email@gmail.com
Reply-to: votre-email@gmail.com
```

### 🔑 Comment obtenir le mot de passe Gmail :

1. Aller sur : https://myaccount.google.com/apppasswords
2. Se connecter avec votre Gmail
3. Sélectionner **"Mail"** et **"Autre (nom personnalisé)"**
4. Entrer : "Maroc Soleil"
5. Cliquer **"Générer"**
6. **Copier les 16 caractères** (ex: `abcd efgh ijkl mnop`)
7. Coller dans le champ **Password** (sans espaces)

---

## 🔵 Option 2 : SendGrid SMTP (Recommandé pour production)

### Paramètres à copier-coller :

```
✅ Enable Custom SMTP: OUI

Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Votre clé API SendGrid - voir ci-dessous]
Sender name: Maroc Soleil
Sender email: noreply@votredomaine.com
Reply-to: contact@votredomaine.com
```

### 🔑 Obtenir la clé API SendGrid :

1. Créer un compte : https://sendgrid.com (gratuit 100 emails/jour)
2. Aller dans **Settings** → **API Keys**
3. **Create API Key** → Nom: "Maroc Soleil"
4. Sélectionner **"Mail Send"** permissions
5. **Copier la clé API**
6. Coller dans le champ **Password**

---

## 🟡 Option 3 : Mailgun SMTP

### Paramètres à copier-coller :

```
✅ Enable Custom SMTP: OUI

Host: smtp.mailgun.org
Port: 587
Username: postmaster@votredomaine.mailgun.org
Password: [Votre mot de passe SMTP Mailgun]
Sender name: Maroc Soleil
Sender email: noreply@votredomaine.com
Reply-to: contact@votredomaine.com
```

---

## 📋 Tableau récapitulatif

| Champ | Gmail | SendGrid | Mailgun |
|-------|-------|----------|---------|
| **Host** | `smtp.gmail.com` | `smtp.sendgrid.net` | `smtp.mailgun.org` |
| **Port** | `587` | `587` | `587` |
| **Username** | `votre-email@gmail.com` | `apikey` | `postmaster@votredomaine.mailgun.org` |
| **Password** | Mot de passe d'application Gmail | Clé API SendGrid | Mot de passe SMTP Mailgun |
| **Sender email** | `votre-email@gmail.com` | `noreply@votredomaine.com` | `noreply@votredomaine.com` |

---

## ⚠️ IMPORTANT : Limitations

**Supabase SMTP (Settings → Auth)** est utilisé pour :
- ✅ Emails d'authentification (confirmation d'inscription)
- ✅ Réinitialisation de mot de passe
- ✅ Changement d'email

**Pour les emails de réservation**, la fonction Edge Function doit utiliser SMTP directement (voir fonction mise à jour).

---

## ✅ Après configuration

1. Cliquer sur **"Send Test Email"** dans Supabase
2. Vérifier votre boîte de réception
3. Si ça fonctionne → ✅ Configuration réussie !

---

## 🆘 Dépannage

### Erreur "Authentication failed"

- Vérifier le mot de passe/clé API
- Pour Gmail : utiliser un mot de passe d'application, pas votre mot de passe normal
- Pour SendGrid : vérifier que c'est bien une clé API avec permission "Mail Send"

### Erreur "Connection timeout"

- Vérifier le port (587 est correct)
- Vérifier le host (copier exactement depuis ce document)

### Emails en spam

- Configurer SPF/DKIM pour votre domaine
- Utiliser un service professionnel (SendGrid/Mailgun)

