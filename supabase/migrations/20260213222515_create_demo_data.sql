/*
  # Création des données de démonstration

  Ce script crée des données de base pour tester l'application:
  - Catégories de produits
  - Produits de démonstration
  - Fournisseurs
  - Clients (hôtels)
  
  Note: Le compte administrateur doit être créé via l'interface Supabase Auth
*/

-- Créer des catégories de produits
INSERT INTO categories (nom, description) VALUES
  ('Fruits et Légumes', 'Produits frais, fruits et légumes de saison'),
  ('Viandes et Poissons', 'Produits carnés frais et fruits de mer'),
  ('Produits laitiers', 'Lait, fromages, yaourts et dérivés'),
  ('Épicerie', 'Produits secs, conserves et épices'),
  ('Boissons', 'Boissons alcoolisées et non alcoolisées'),
  ('Pâtisserie', 'Produits de boulangerie et pâtisserie')
ON CONFLICT (nom) DO NOTHING;

-- Créer des produits de démonstration
DO $$
DECLARE
  cat_fruits uuid;
  cat_viandes uuid;
  cat_laitiers uuid;
  cat_epicerie uuid;
  cat_boissons uuid;
BEGIN
  -- Récupérer les IDs des catégories
  SELECT id INTO cat_fruits FROM categories WHERE nom = 'Fruits et Légumes' LIMIT 1;
  SELECT id INTO cat_viandes FROM categories WHERE nom = 'Viandes et Poissons' LIMIT 1;
  SELECT id INTO cat_laitiers FROM categories WHERE nom = 'Produits laitiers' LIMIT 1;
  SELECT id INTO cat_epicerie FROM categories WHERE nom = 'Épicerie' LIMIT 1;
  SELECT id INTO cat_boissons FROM categories WHERE nom = 'Boissons' LIMIT 1;
  
  -- Insérer des produits
  INSERT INTO produits (nom, reference, categorie_id, description, unite_mesure, prix_unitaire, stock_actuel, stock_minimum) VALUES
    ('Tomates fraîches', 'FRU-001', cat_fruits, 'Tomates rouges de qualité premium', 'kg', 1500, 50, 10),
    ('Oignons', 'FRU-002', cat_fruits, 'Oignons jaunes', 'kg', 1200, 30, 10),
    ('Pommes de terre', 'FRU-003', cat_fruits, 'Pommes de terre blanches', 'kg', 800, 100, 20),
    ('Carottes', 'FRU-004', cat_fruits, 'Carottes fraîches', 'kg', 1000, 40, 10),
    
    ('Poulet entier', 'VIA-001', cat_viandes, 'Poulet fermier', 'kg', 4500, 20, 5),
    ('Poisson tilapia', 'VIA-002', cat_viandes, 'Tilapia frais du fleuve', 'kg', 3500, 15, 5),
    ('Viande de bœuf', 'VIA-003', cat_viandes, 'Bœuf de première qualité', 'kg', 8000, 25, 5),
    ('Crevettes', 'VIA-004', cat_viandes, 'Crevettes fraîches', 'kg', 12000, 10, 3),
    
    ('Lait frais', 'LAI-001', cat_laitiers, 'Lait pasteurisé', 'L', 1500, 60, 15),
    ('Fromage', 'LAI-002', cat_laitiers, 'Fromage gouda', 'kg', 8500, 20, 5),
    ('Yaourt nature', 'LAI-003', cat_laitiers, 'Yaourt nature', 'unité', 800, 100, 20),
    
    ('Riz blanc', 'EPI-001', cat_epicerie, 'Riz long grain', 'sac', 45000, 100, 20),
    ('Huile végétale', 'EPI-002', cat_epicerie, 'Huile de palme raffinée', 'L', 3000, 40, 10),
    ('Farine de blé', 'EPI-003', cat_epicerie, 'Farine tout usage', 'kg', 2500, 80, 15),
    ('Sucre blanc', 'EPI-004', cat_epicerie, 'Sucre cristallisé', 'kg', 1800, 150, 30),
    
    ('Eau minérale', 'BOI-001', cat_boissons, 'Eau en bouteille 1.5L', 'carton', 8000, 200, 40),
    ('Coca-Cola', 'BOI-002', cat_boissons, 'Coca-Cola 33cl', 'carton', 12000, 100, 20),
    ('Jus d''orange', 'BOI-003', cat_boissons, 'Jus d''orange naturel 1L', 'unité', 2500, 50, 10)
  ON CONFLICT (reference) DO NOTHING;
END $$;

-- Créer des fournisseurs de démonstration
INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, actif) VALUES
  ('Marché Central', 'Jean Mukendi', '+243 900 111 111', 'contact@marchecentral.cd', 'Avenue Kasa-Vubu, Kinshasa', true),
  ('Ferme Bio Congo', 'Marie Nsimba', '+243 900 222 222', 'info@fermebio.cd', 'Zone agricole de N''sele, Kinshasa', true),
  ('Pêcherie du Fleuve', 'Paul Kabongo', '+243 900 333 333', 'pecherie@fleuve.cd', 'Port de Kinshasa', true),
  ('Brasserie Locale', 'Sophie Mbuyi', '+243 900 444 444', 'ventes@brasserie.cd', 'Zone industrielle, Limete', true)
ON CONFLICT DO NOTHING;

-- Créer des clients de démonstration (hôtels)
INSERT INTO clients (nom, contact, telephone, email, adresse, ville, latitude, longitude, actif) VALUES
  ('Hôtel Memling', 'Directeur Général', '+243 900 555 555', 'reservation@memling.cd', 'Avenue de la Liberation, Gombe', 'Kinshasa', -4.3256, 15.3222, true),
  ('Pullman Kinshasa Grand Hotel', 'Chef des Achats', '+243 900 666 666', 'achats@pullman.cd', 'Boulevard du 30 Juin, Gombe', 'Kinshasa', -4.3145, 15.3189, true),
  ('Hôtel Invest', 'Responsable Approvisionnement', '+243 900 777 777', 'appro@invest.cd', 'Avenue Colonel Mondjiba, Ngaliema', 'Kinshasa', -4.3890, 15.2667, true),
  ('Fleuve Congo Hotel', 'Manager Restauration', '+243 900 888 888', 'resto@fleuvehotel.cd', 'Boulevard du 30 Juin, Gombe', 'Kinshasa', -4.3178, 15.3156, true)
ON CONFLICT DO NOTHING;

-- Créer quelques livreurs de démonstration
INSERT INTO livreurs (nom, telephone, vehicule, immatriculation, statut, actif) VALUES
  ('Jacques Mutombo', '+243 900 100 001', 'Toyota Hilux', 'CD-123-KIN', 'DISPONIBLE', true),
  ('Pierre Kasongo', '+243 900 100 002', 'Isuzu D-Max', 'CD-456-KIN', 'DISPONIBLE', true),
  ('André Tshimanga', '+243 900 100 003', 'Mitsubishi L200', 'CD-789-KIN', 'DISPONIBLE', true)
ON CONFLICT DO NOTHING;