/*
  # Ajout du fournisseur aux produits
  
  1. Modifications
    - Ajout de la colonne `fournisseur_id` à la table `produits`
    - Ajout de la relation avec la table `fournisseurs`
  
  2. Notes importantes
    - Le fournisseur est optionnel pour permettre la flexibilité
    - Les produits existants auront un fournisseur NULL par défaut
*/

-- Ajouter la colonne fournisseur_id à la table produits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produits' AND column_name = 'fournisseur_id'
  ) THEN
    ALTER TABLE produits ADD COLUMN fournisseur_id uuid REFERENCES fournisseurs(id);
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_id);