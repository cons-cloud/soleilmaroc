# Guide : Personnalisation de l'authentification Google (Branding)

Pour que vos utilisateurs voient "Maroc Soleil" (et votre logo) à la place du nom technique Supabase lors de la connexion Google, vous devez configurer l'écran de consentement Google.

## 1. Google Cloud Console

1.  Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2.  Sélectionnez votre projet (celui lié à Supabase).
3.  Allez dans **APIs & Services** > **OAuth consent screen**.
4.  Cliquez sur **EDIT APP**.
5.  Modifiez les informations suivantes :
    *   **App name** : Entrez "Maroc Soleil".
    *   **User support email** : Votre adresse email de support.
    *   **App logo** : Téléchargez votre logo (obligatoire pour masquer l'URL).
    *   **Application home page** : `http://localhost:3000` (ou votre domaine final).
    *   **Privacy Policy link** : Votre lien vers la politique de confidentialité.
6.  Enregistrez. **Note :** Google peut demander une vérification si vous utilisez des logos ou des scopes sensibles.

## 2. Supabase Dashboard

1.  Allez dans votre projet sur le [Tableau de bord Supabase](https://app.supabase.com/).
2.  Allez dans **Authentication** > **Providers** > **Google**.
3.  Vérifiez que votre **Client ID** et **Client Secret** sont bien ceux du projet Google Cloud que vous venez de configurer.
4.  Allez dans **Settings** > **General**.
5.  Changez le **Project name** en "Maroc Soleil" (cela impacte certains emails automatiques).

## 3. Site URL (Supabase)

1.  Allez dans **Authentication** > **URL Configuration**.
2.  Assurez-vous que le **Site URL** est correct (votre futur domaine ou `http://localhost:3000`).

---

Une fois ces étapes validées dans la Google Cloud Console, les utilisateurs verront une fenêtre de connexion professionnelle avec votre nom et votre logo.
