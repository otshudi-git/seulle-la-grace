export type UserRole = 'ADMIN' | 'MAGASINIER' | 'CAISSIER' | 'LIVREUR';

export type StatutLivraison = 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
export type StatutPaiement = 'NON_PAYE' | 'PARTIEL' | 'PAYE';
export type ModePaiement = 'CASH' | 'MOBILE_MONEY' | 'BANQUE' | 'CHEQUE';
export type TypeMouvement = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'PERTE';
export type StatutLot = 'BON' | 'PROCHE_EXPIRATION' | 'EXPIRE';
export type RaisonPerte = 'EXPIRE' | 'ALTERATION' | 'CASSE' | 'VOL' | 'AUTRE';
export type StatutLivreur = 'DISPONIBLE' | 'EN_LIVRAISON' | 'INDISPONIBLE';

export interface Profile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: UserRole;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categorie {
  id: string;
  nom: string;
  description?: string;
  created_at: string;
}

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  categorie_id?: string;
  description?: string;
  unite_mesure: string;
  prix_unitaire: number;
  stock_actuel: number;
  stock_minimum: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
  categorie?: Categorie;
}

export interface Fournisseur {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  adresse?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProduitFournisseur {
  id: string;
  produit_id: string;
  fournisseur_id: string;
  prix_fournisseur: number;
  reference_produit_fournisseur?: string;
  delai_livraison_jours: number;
  created_at: string;
  produit?: Produit;
  fournisseur?: Fournisseur;
}

export interface Client {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Livreur {
  id: string;
  user_id?: string;
  nom: string;
  telephone: string;
  vehicule?: string;
  immatriculation?: string;
  statut: StatutLivreur;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface LotProduit {
  id: string;
  produit_id: string;
  numero_lot: string;
  date_fabrication?: string;
  date_expiration?: string;
  quantite_initiale: number;
  quantite_restante: number;
  statut: StatutLot;
  created_at: string;
  updated_at: string;
  produit?: Produit;
}

export interface MouvementStock {
  id: string;
  produit_id: string;
  lot_id?: string;
  type_mouvement: TypeMouvement;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  reference?: string;
  motif?: string;
  user_id?: string;
  created_at: string;
  produit?: Produit;
  lot?: LotProduit;
}

export interface Approvisionnement {
  id: string;
  numero_appro: string;
  fournisseur_id: string;
  date_appro: string;
  montant_total: number;
  statut_paiement: 'NON_PAYE' | 'PAYE';
  date_paiement?: string;
  notes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  fournisseur?: Fournisseur;
}

export interface ApprovisionnementItem {
  id: string;
  approvisionnement_id: string;
  produit_id: string;
  lot_id?: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  created_at: string;
  produit?: Produit;
}

export interface Commande {
  id: string;
  numero_commande: string;
  client_id: string;
  date_commande: string;
  statut_livraison: StatutLivraison;
  statut_paiement: StatutPaiement;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  livreur_id?: string;
  heure_depart?: string;
  heure_arrivee?: string;
  notes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  livreur?: Livreur;
}

export interface CommandeItem {
  id: string;
  commande_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  created_at: string;
  produit?: Produit;
}

export interface Paiement {
  id: string;
  commande_id: string;
  montant: number;
  mode_paiement: ModePaiement;
  reference?: string;
  date_paiement: string;
  notes?: string;
  user_id?: string;
  created_at: string;
}

export interface TrackingLivraison {
  id: string;
  commande_id: string;
  livreur_id: string;
  latitude: number;
  longitude: number;
  vitesse?: number;
  timestamp: string;
}

export interface PerteStock {
  id: string;
  produit_id: string;
  lot_id?: string;
  quantite_perdue: number;
  raison: RaisonPerte;
  description?: string;
  responsable_id?: string;
  date_perte: string;
  created_at: string;
  produit?: Produit;
  lot?: LotProduit;
}
