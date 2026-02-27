# Instructions de Connexion - Seule La Grâce

## Création du premier compte administrateur

Pour créer votre compte administrateur, suivez ces étapes:

### Méthode 1: Via le Dashboard Supabase (Recommandé)

1. **Accédez à votre Dashboard Supabase**
   - Rendez-vous sur: https://supabase.com/dashboard
   - Connectez-vous et sélectionnez votre projet

2. **Accédez à Authentication**
   - Dans le menu latéral, cliquez sur "Authentication"
   - Cliquez sur "Users"

3. **Créez un nouvel utilisateur**
   - Cliquez sur "Add user" puis "Create new user"
   - Remplissez les informations:
     - **Email**: `admin@seulelgrace.com` (ou votre email)
     - **Password**: `Admin2024!` (ou votre mot de passe sécurisé)
     - Cochez "Auto Confirm User"
   - Cliquez sur "Create user"

4. **Créez le profil utilisateur**
   - Dans le menu latéral, cliquez sur "Table Editor"
   - Sélectionnez la table "profiles"
   - Cliquez sur "Insert" puis "Insert row"
   - Remplissez les champs:
     - **id**: Copiez l'UUID de l'utilisateur créé (depuis Authentication > Users)
     - **email**: `admin@seulelgrace.com` (le même que l'utilisateur)
     - **nom**: `Admin`
     - **prenom**: `Système`
     - **telephone**: `+243 900 000 000`
     - **role**: `ADMIN` (sélectionnez dans la liste)
     - **actif**: `true`
   - Cliquez sur "Save"

### Méthode 2: Via SQL Query

Vous pouvez également exécuter cette requête SQL dans l'éditeur SQL de Supabase:

```sql
-- Notez l'ID de l'utilisateur que vous avez créé dans Auth
-- Remplacez 'VOTRE-USER-ID-ICI' par l'UUID réel

INSERT INTO profiles (id, email, nom, prenom, telephone, role, actif)
VALUES (
  'VOTRE-USER-ID-ICI',  -- UUID de l'utilisateur Auth
  'admin@seulelgrace.com',
  'Admin',
  'Système',
  '+243 900 000 000',
  'ADMIN',
  true
);
```

## Identifiants de connexion

Une fois le compte créé, connectez-vous avec:

- **Email**: `admin@seulelgrace.com`
- **Mot de passe**: `Admin2024!`

## Données de démonstration

L'application contient déjà des données de test:

### Catégories
- Fruits et Légumes
- Viandes et Poissons
- Produits laitiers
- Épicerie
- Boissons
- Pâtisserie

### Produits (18 produits)
- Tomates, Oignons, Pommes de terre, Carottes
- Poulet, Tilapia, Bœuf, Crevettes
- Lait, Fromage, Yaourt
- Riz, Huile, Farine, Sucre
- Eau minérale, Coca-Cola, Jus d'orange

### Fournisseurs (4 fournisseurs)
- Marché Central
- Ferme Bio Congo
- Pêcherie du Fleuve
- Brasserie Locale

### Clients/Hôtels (4 hôtels)
- Hôtel Memling
- Pullman Kinshasa Grand Hotel
- Hôtel Invest
- Fleuve Congo Hotel

### Livreurs (3 livreurs)
- Jacques Mutombo (Toyota Hilux)
- Pierre Kasongo (Isuzu D-Max)
- André Tshimanga (Mitsubishi L200)

## Rôles disponibles

Le système supporte 4 types de rôles:

1. **ADMIN**: Accès complet à tous les modules
2. **MAGASINIER**: Gestion des stocks, produits, fournisseurs, commandes
3. **CAISSIER**: Gestion des commandes, paiements, clients
4. **LIVREUR**: Accès aux livraisons et tracking GPS

## Modules disponibles

1. **Tableau de bord**: Vue d'ensemble avec statistiques
2. **Produits**: Gestion du catalogue produits
3. **Stock & Lots**: Gestion des lots avec dates d'expiration
4. **Fournisseurs**: Gestion des fournisseurs
5. **Clients (Hôtels)**: Gestion des clients
6. **Commandes**: Gestion des commandes avec statuts
7. **Livraisons**: Suivi des livraisons en temps réel
8. **Rapports**: Statistiques et rapports d'activité

## Support

Pour toute question ou problème de connexion, vérifiez:
- Que l'utilisateur existe dans Authentication > Users
- Que le profil existe dans la table profiles avec le même ID
- Que le rôle est bien défini (ADMIN, MAGASINIER, CAISSIER, ou LIVREUR)
- Que l'utilisateur est actif (actif = true)

## Sécurité

**IMPORTANT**: Changez le mot de passe par défaut après votre première connexion!
