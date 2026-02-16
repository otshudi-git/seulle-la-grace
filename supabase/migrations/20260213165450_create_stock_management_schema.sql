/*
  # Création du schéma complet pour la gestion de stock et livraison

  ## Tables créées
  
  ### 1. Gestion des utilisateurs
    - `profiles` - Profils utilisateurs avec rôles (ADMIN, MAGASINIER, CAISSIER, LIVREUR)
  
  ### 2. Gestion des produits
    - `categories` - Catégories de produits
    - `produits` - Produits avec stock minimum et informations
    - `lots_produits` - Gestion des lots avec dates d'expiration
    - `mouvements_stock` - Historique des mouvements de stock
    - `pertes_stock` - Enregistrement des pertes
  
  ### 3. Gestion des partenaires
    - `fournisseurs` - Fournisseurs
    - `produit_fournisseurs` - Relation many-to-many produits-fournisseurs avec prix
    - `clients` - Clients (hôtels)
    - `livreurs` - Livreurs avec véhicule et statut
  
  ### 4. Gestion des opérations
    - `approvisionnements` - Entrées de stock
    - `commandes` - Commandes avec statuts livraison et paiement
    - `commande_items` - Détails des produits commandés
    - `paiements` - Paiements avec support paiement partiel
    - `tracking_livraison` - Suivi GPS des livraisons
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques d'accès selon les rôles utilisateurs
*/

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs avec rôles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MAGASINIER', 'CAISSIER', 'LIVREUR')),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  reference text UNIQUE NOT NULL,
  categorie_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  unite_mesure text NOT NULL DEFAULT 'kg',
  prix_unitaire numeric(10,2) NOT NULL DEFAULT 0,
  stock_actuel numeric(10,2) NOT NULL DEFAULT 0,
  stock_minimum numeric(10,2) NOT NULL DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  contact text NOT NULL,
  telephone text NOT NULL,
  email text,
  adresse text,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table relation produits-fournisseurs
CREATE TABLE IF NOT EXISTS produit_fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  fournisseur_id uuid NOT NULL REFERENCES fournisseurs(id) ON DELETE CASCADE,
  prix_fournisseur numeric(10,2) NOT NULL,
  reference_produit_fournisseur text,
  delai_livraison_jours integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(produit_id, fournisseur_id)
);

-- Table des clients (hôtels)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  contact text NOT NULL,
  telephone text NOT NULL,
  email text,
  adresse text NOT NULL,
  ville text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des livreurs
CREATE TABLE IF NOT EXISTS livreurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  nom text NOT NULL,
  telephone text NOT NULL,
  vehicule text,
  immatriculation text,
  statut text NOT NULL DEFAULT 'DISPONIBLE' CHECK (statut IN ('DISPONIBLE', 'EN_LIVRAISON', 'INDISPONIBLE')),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des lots de produits
CREATE TABLE IF NOT EXISTS lots_produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  numero_lot text NOT NULL,
  date_fabrication date,
  date_expiration date,
  quantite_initiale numeric(10,2) NOT NULL,
  quantite_restante numeric(10,2) NOT NULL,
  statut text NOT NULL DEFAULT 'BON' CHECK (statut IN ('BON', 'PROCHE_EXPIRATION', 'EXPIRE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  lot_id uuid REFERENCES lots_produits(id) ON DELETE SET NULL,
  type_mouvement text NOT NULL CHECK (type_mouvement IN ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE')),
  quantite numeric(10,2) NOT NULL,
  stock_avant numeric(10,2) NOT NULL,
  stock_apres numeric(10,2) NOT NULL,
  reference text,
  motif text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des approvisionnements
CREATE TABLE IF NOT EXISTS approvisionnements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_appro text UNIQUE NOT NULL,
  fournisseur_id uuid NOT NULL REFERENCES fournisseurs(id) ON DELETE RESTRICT,
  date_appro date NOT NULL DEFAULT CURRENT_DATE,
  montant_total numeric(10,2) NOT NULL DEFAULT 0,
  statut_paiement text NOT NULL DEFAULT 'NON_PAYE' CHECK (statut_paiement IN ('NON_PAYE', 'PAYE')),
  date_paiement date,
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des items d'approvisionnement
CREATE TABLE IF NOT EXISTS approvisionnement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approvisionnement_id uuid NOT NULL REFERENCES approvisionnements(id) ON DELETE CASCADE,
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE RESTRICT,
  lot_id uuid REFERENCES lots_produits(id) ON DELETE SET NULL,
  quantite numeric(10,2) NOT NULL,
  prix_unitaire numeric(10,2) NOT NULL,
  montant numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_commande text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  date_commande timestamptz NOT NULL DEFAULT now(),
  statut_livraison text NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut_livraison IN ('EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ANNULEE')),
  statut_paiement text NOT NULL DEFAULT 'NON_PAYE' CHECK (statut_paiement IN ('NON_PAYE', 'PARTIEL', 'PAYE')),
  montant_total numeric(10,2) NOT NULL DEFAULT 0,
  montant_paye numeric(10,2) NOT NULL DEFAULT 0,
  montant_restant numeric(10,2) NOT NULL DEFAULT 0,
  livreur_id uuid REFERENCES livreurs(id) ON DELETE SET NULL,
  heure_depart timestamptz,
  heure_arrivee timestamptz,
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des items de commande
CREATE TABLE IF NOT EXISTS commande_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id uuid NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE RESTRICT,
  quantite numeric(10,2) NOT NULL,
  prix_unitaire numeric(10,2) NOT NULL,
  montant numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id uuid NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  montant numeric(10,2) NOT NULL,
  mode_paiement text NOT NULL CHECK (mode_paiement IN ('CASH', 'MOBILE_MONEY', 'BANQUE', 'CHEQUE')),
  reference text,
  date_paiement timestamptz NOT NULL DEFAULT now(),
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table de tracking des livraisons
CREATE TABLE IF NOT EXISTS tracking_livraison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id uuid NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  livreur_id uuid NOT NULL REFERENCES livreurs(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  vitesse numeric(5,2),
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Table des pertes de stock
CREATE TABLE IF NOT EXISTS pertes_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  lot_id uuid REFERENCES lots_produits(id) ON DELETE SET NULL,
  quantite_perdue numeric(10,2) NOT NULL,
  raison text NOT NULL CHECK (raison IN ('EXPIRE', 'ALTERATION', 'CASSE', 'VOL', 'AUTRE')),
  description text,
  responsable_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  date_perte date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produits_stock ON produits(stock_actuel);
CREATE INDEX IF NOT EXISTS idx_lots_produit ON lots_produits(produit_id);
CREATE INDEX IF NOT EXISTS idx_lots_expiration ON lots_produits(date_expiration);
CREATE INDEX IF NOT EXISTS idx_lots_statut ON lots_produits(statut);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_livreur ON commandes(livreur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut_livraison ON commandes(statut_livraison);
CREATE INDEX IF NOT EXISTS idx_commandes_statut_paiement ON commandes(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_tracking_commande ON tracking_livraison(commande_id);
CREATE INDEX IF NOT EXISTS idx_tracking_timestamp ON tracking_livraison(timestamp DESC);

-- Activation RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE produit_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE livreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvisionnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvisionnement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commande_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE pertes_stock ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Politiques RLS pour catégories (tous les utilisateurs authentifiés peuvent voir)
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour produits
CREATE POLICY "Authenticated users can view products"
  ON produits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage products"
  ON produits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour fournisseurs
CREATE POLICY "Authenticated users can view suppliers"
  ON fournisseurs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage suppliers"
  ON fournisseurs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour produit_fournisseurs
CREATE POLICY "Authenticated users can view product suppliers"
  ON produit_fournisseurs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage product suppliers"
  ON produit_fournisseurs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour livreurs
CREATE POLICY "Authenticated users can view livreurs"
  ON livreurs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage livreurs"
  ON livreurs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Politiques RLS pour lots_produits
CREATE POLICY "Authenticated users can view lots"
  ON lots_produits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage lots"
  ON lots_produits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour mouvements_stock
CREATE POLICY "Authenticated users can view stock movements"
  ON mouvements_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can create stock movements"
  ON mouvements_stock FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour approvisionnements
CREATE POLICY "Authenticated users can view approvisionnements"
  ON approvisionnements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage approvisionnements"
  ON approvisionnements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour approvisionnement_items
CREATE POLICY "Authenticated users can view approvisionnement items"
  ON approvisionnement_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage approvisionnement items"
  ON approvisionnement_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour commandes
CREATE POLICY "Authenticated users can view commandes"
  ON commandes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, magasinier, and caissier can manage commandes"
  ON commandes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER', 'CAISSIER')
    )
  );

-- Politiques RLS pour commande_items
CREATE POLICY "Authenticated users can view commande items"
  ON commande_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, magasinier, and caissier can manage commande items"
  ON commande_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER', 'CAISSIER')
    )
  );

-- Politiques RLS pour paiements
CREATE POLICY "Authenticated users can view paiements"
  ON paiements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and caissier can manage paiements"
  ON paiements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'CAISSIER')
    )
  );

-- Politiques RLS pour tracking_livraison
CREATE POLICY "Authenticated users can view tracking"
  ON tracking_livraison FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Livreurs can insert their tracking"
  ON tracking_livraison FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'LIVREUR'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Politiques RLS pour pertes_stock
CREATE POLICY "Authenticated users can view pertes"
  ON pertes_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and magasinier can manage pertes"
  ON pertes_stock FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MAGASINIER')
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON produits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fournisseurs_updated_at BEFORE UPDATE ON fournisseurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_livreurs_updated_at BEFORE UPDATE ON livreurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON lots_produits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvisionnements_updated_at BEFORE UPDATE ON approvisionnements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();