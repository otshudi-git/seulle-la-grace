/*
  # Add fournisseur to lots_produits

  1. Changes
    - Add fournisseur_id column to lots_produits table
    - Add foreign key constraint to fournisseurs table
*/

-- Add fournisseur_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots_produits' AND column_name = 'fournisseur_id'
  ) THEN
    ALTER TABLE lots_produits ADD COLUMN fournisseur_id uuid REFERENCES fournisseurs(id);
  END IF;
END $$;