# 🔧 INSTRUCTIONS POUR CORRIGER LES ERREURS 403

## ❌ ERREURS ACTUELLES

1. **Erreur 403 pour `activites_touristiques`** : Permission denied
2. **Erreur 403 pour `bookings`** : Permission denied

## ✅ SOLUTION : Exécuter les scripts SQL dans l'ordre

### ÉTAPE 1 : Créer la table `activites_touristiques` (si elle n'existe pas)

1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Ouvrez le fichier : `supabase/create-activites-table.sql`
4. Copiez tout le contenu du fichier
5. Collez-le dans Supabase SQL Editor
6. Cliquez sur **Run** ou appuyez sur `Cmd+Enter`

### ÉTAPE 2 : Corriger les politiques RLS pour les deux tables

1. Toujours dans Supabase SQL Editor
2. Ouvrez le fichier : `supabase/fix-rls-final-no-errors.sql`
3. Copiez tout le contenu du fichier
4. Collez-le dans Supabase SQL Editor
5. Cliquez sur **Run** ou appuyez sur `Cmd+Enter`

### ÉTAPE 3 : Vérifier que ça fonctionne

1. Déconnectez-vous du dashboard admin
2. Reconnectez-vous avec votre compte admin
3. Essayez d'accéder à l'onglet **Réservations**
4. Essayez d'accéder à l'onglet **Activités**

## 📋 CE QUE FONT LES SCRIPTS

### `create-activites-table.sql`
- Crée la table `activites_touristiques` si elle n'existe pas
- Crée les index pour améliorer les performances
- Configure les triggers automatiques
- Active RLS et crée les politiques de base

### `fix-rls-final-no-errors.sql`
- Crée une fonction helper `is_admin()` pour éviter la récursion RLS
- Supprime **TOUTES** les anciennes politiques sur `bookings` et `activites_touristiques`
- Crée de nouvelles politiques simples et efficaces
- Permet l'accès complet aux admins sans erreur 403
- Donne les permissions GRANT nécessaires

## 🔍 VÉRIFICATION

Après avoir exécuté les scripts, vous pouvez vérifier que tout fonctionne avec cette requête SQL dans Supabase :

```sql
-- Vérifier les politiques créées
SELECT 
    tablename as "Table",
    policyname as "Politique",
    cmd as "Commande"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'activites_touristiques')
ORDER BY tablename, policyname;
```

Vous devriez voir :
- Pour `bookings` : Au moins 3 politiques (Admins full access, Users view own, Users create own)
- Pour `activites_touristiques` : Au moins 3 politiques (Public read, Admins full access, Partners manage own)

## ⚠️ SI LES ERREURS PERSISTENT

1. **Vérifiez que vous êtes bien connecté en tant qu'admin** :
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```
   Le `role` doit être `admin`.

2. **Vérifiez que RLS est bien activé** :
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('bookings', 'activites_touristiques');
   ```
   `rowsecurity` doit être `true` pour les deux tables.

3. **Déconnectez-vous et reconnectez-vous** pour rafraîchir le JWT avec les nouvelles permissions.

4. **Vérifiez les logs dans la console du navigateur** pour voir les détails de l'erreur exacte.

## 🆘 BESOIN D'AIDE ?

Si les erreurs persistent après avoir exécuté ces scripts :
1. Vérifiez que les scripts ont bien été exécutés sans erreur
2. Vérifiez les messages d'erreur dans Supabase SQL Editor
3. Vérifiez les logs dans la console du navigateur (F12)

