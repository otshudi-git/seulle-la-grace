/*
  # Advanced Stock Reports and Views

  1. New Views
    - `vue_stock_disponible`: Quantité disponible par produit avec valeurs
    - `vue_mouvements_stock`: Historique des mouvements (entrées/sorties)
    - `vue_ventes_detaillees`: Ventes détaillées avec marges
    - `vue_achats_lots`: Achats par lots avec totaux

  2. Features
    - Calcul automatique des quantités disponibles
    - Valeur totale du stock
    - Marges et profits
    - Alertes sur stocks faibles
*/

-- Vue pour le stock disponible par produit
CREATE OR REPLACE VIEW vue_stock_disponible AS
SELECT
  p.id AS produit_id,
  p.nom AS produit_nom,
  p.reference AS produit_reference,
  p.unite_mesure,
  p.prix_unitaire AS prix_vente,
  p.stock_minimum,
  COALESCE(SUM(lp.quantite_restante), 0) AS quantite_disponible,
  COALESCE(AVG(lp.prix_achat_unitaire), 0) AS prix_achat_moyen,
  COALESCE(SUM(lp.quantite_restante * lp.prix_achat_unitaire), 0) AS valeur_stock_achat,
  COALESCE(SUM(lp.quantite_restante * p.prix_unitaire), 0) AS valeur_stock_vente,
  COALESCE(SUM(lp.quantite_restante * (p.prix_unitaire - lp.prix_achat_unitaire)), 0) AS profit_potentiel,
  CASE
    WHEN COALESCE(SUM(lp.quantite_restante), 0) = 0 THEN 'RUPTURE'
    WHEN COALESCE(SUM(lp.quantite_restante), 0) <= p.stock_minimum THEN 'FAIBLE'
    ELSE 'BON'
  END AS statut_stock,
  c.nom AS categorie_nom
FROM produits p
LEFT JOIN lots_produits lp ON p.id = lp.produit_id AND lp.statut = 'BON'
LEFT JOIN categories c ON p.categorie_id = c.id
WHERE p.actif = true
GROUP BY p.id, p.nom, p.reference, p.unite_mesure, p.prix_unitaire, p.stock_minimum, c.nom;

-- Vue pour les mouvements de stock
CREATE OR REPLACE VIEW vue_mouvements_stock AS
SELECT
  'ENTREE' AS type_mouvement,
  lp.id AS reference_id,
  lp.numero_lot AS reference,
  lp.created_at AS date_mouvement,
  p.id AS produit_id,
  p.nom AS produit_nom,
  lp.quantite_initiale AS quantite,
  lp.prix_achat_unitaire AS prix_unitaire,
  lp.quantite_initiale * lp.prix_achat_unitaire AS valeur_totale,
  f.nom AS tiers,
  'Réception lot' AS description
FROM lots_produits lp
JOIN produits p ON lp.produit_id = p.id
LEFT JOIN fournisseurs f ON lp.fournisseur_id = f.id

UNION ALL

SELECT
  'SORTIE' AS type_mouvement,
  ci.id AS reference_id,
  c.numero_commande AS reference,
  c.date_commande AS date_mouvement,
  p.id AS produit_id,
  p.nom AS produit_nom,
  ci.quantite AS quantite,
  ci.prix_unitaire AS prix_unitaire,
  ci.montant AS valeur_totale,
  cl.nom AS tiers,
  'Vente commande' AS description
FROM commande_items ci
JOIN commandes c ON ci.commande_id = c.id
JOIN produits p ON ci.produit_id = p.id
LEFT JOIN clients cl ON c.client_id = cl.id;

-- Vue pour les ventes détaillées avec marges
CREATE OR REPLACE VIEW vue_ventes_detaillees AS
SELECT
  c.id AS commande_id,
  c.numero_commande,
  c.date_commande,
  cl.nom AS client_nom,
  ci.id AS item_id,
  p.id AS produit_id,
  p.nom AS produit_nom,
  ci.quantite,
  ci.prix_unitaire AS prix_vente,
  ci.montant AS montant_vente,
  COALESCE(
    (SELECT AVG(lp.prix_achat_unitaire)
     FROM lots_produits lp
     WHERE lp.produit_id = p.id AND lp.statut = 'BON'),
    0
  ) AS prix_achat_moyen,
  ci.montant - (ci.quantite * COALESCE(
    (SELECT AVG(lp.prix_achat_unitaire)
     FROM lots_produits lp
     WHERE lp.produit_id = p.id AND lp.statut = 'BON'),
    0
  )) AS profit_realise,
  CASE
    WHEN COALESCE(
      (SELECT AVG(lp.prix_achat_unitaire)
       FROM lots_produits lp
       WHERE lp.produit_id = p.id AND lp.statut = 'BON'),
      0
    ) > 0 THEN
      ((ci.prix_unitaire - COALESCE(
        (SELECT AVG(lp.prix_achat_unitaire)
         FROM lots_produits lp
         WHERE lp.produit_id = p.id AND lp.statut = 'BON'),
        0
      )) / COALESCE(
        (SELECT AVG(lp.prix_achat_unitaire)
         FROM lots_produits lp
         WHERE lp.produit_id = p.id AND lp.statut = 'BON'),
        0
      ) * 100)
    ELSE 0
  END AS marge_pourcentage,
  c.statut_livraison,
  c.statut_paiement
FROM commande_items ci
JOIN commandes c ON ci.commande_id = c.id
JOIN produits p ON ci.produit_id = p.id
LEFT JOIN clients cl ON c.client_id = cl.id;

-- Vue pour les achats par lots
CREATE OR REPLACE VIEW vue_achats_lots AS
SELECT
  lp.id AS lot_id,
  lp.numero_lot,
  lp.created_at AS date_achat,
  f.nom AS fournisseur_nom,
  p.id AS produit_id,
  p.nom AS produit_nom,
  p.reference AS produit_reference,
  lp.quantite_initiale,
  lp.quantite_restante,
  lp.quantite_initiale - lp.quantite_restante AS quantite_vendue,
  lp.prix_achat_unitaire,
  lp.quantite_initiale * lp.prix_achat_unitaire AS montant_total_achat,
  p.prix_unitaire AS prix_vente,
  lp.quantite_restante * lp.prix_achat_unitaire AS valeur_stock_restant,
  (lp.quantite_initiale - lp.quantite_restante) * p.prix_unitaire AS revenu_potentiel_vendu,
  (lp.quantite_initiale - lp.quantite_restante) * (p.prix_unitaire - lp.prix_achat_unitaire) AS profit_vendu,
  lp.statut,
  lp.date_fabrication,
  lp.date_expiration,
  CASE
    WHEN lp.date_expiration IS NOT NULL AND lp.date_expiration < CURRENT_DATE THEN 'EXPIRE'
    WHEN lp.date_expiration IS NOT NULL AND lp.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'PROCHE_EXPIRATION'
    ELSE 'VALIDE'
  END AS statut_expiration
FROM lots_produits lp
JOIN produits p ON lp.produit_id = p.id
LEFT JOIN fournisseurs f ON lp.fournisseur_id = f.id;