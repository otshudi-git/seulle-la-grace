import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LotProduit, Produit, Profile, Fournisseur } from '../types';
import { Package, Plus, X, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

interface StockLotsModuleProps {
  profile: Profile;
}

export default function StockLotsModule({ profile }: StockLotsModuleProps) {
  const [lots, setLots] = useState<LotProduit[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    produit_id: '',
    fournisseur_id: '',
    numero_lot: '',
    quantite_initiale: 0,
    date_fabrication: '',
    date_expiration: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lotsRes, produitsRes, fournisseursRes] = await Promise.all([
        supabase
          .from('lots_produits')
          .select('*, produit:produits(*), fournisseur:fournisseurs(*)')
          .order('date_expiration', { ascending: true }),
        supabase.from('produits').select('*').eq('actif', true).order('nom'),
        supabase.from('fournisseurs').select('*').eq('actif', true).order('nom'),
      ]);

      if (lotsRes.data) setLots(lotsRes.data);
      if (produitsRes.data) setProduits(produitsRes.data);
      if (fournisseursRes.data) setFournisseurs(fournisseursRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.produit_id) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    try {
      const { data: produit } = await supabase
        .from('produits')
        .select('stock_actuel')
        .eq('id', formData.produit_id)
        .single();

      if (!produit) {
        alert('Produit introuvable');
        return;
      }

      const nouvelleQuantite = produit.stock_actuel + formData.quantite_initiale;

      const { error: lotError } = await supabase.from('lots_produits').insert([
        {
          produit_id: formData.produit_id,
          fournisseur_id: formData.fournisseur_id || null,
          numero_lot: formData.numero_lot,
          quantite_initiale: formData.quantite_initiale,
          quantite_restante: formData.quantite_initiale,
          date_fabrication: formData.date_fabrication || null,
          date_expiration: formData.date_expiration || null,
          statut: 'BON',
        },
      ]);

      if (lotError) throw lotError;

      await supabase
        .from('mouvements_stock')
        .insert([
          {
            produit_id: formData.produit_id,
            type_mouvement: 'ENTREE',
            quantite: formData.quantite_initiale,
            stock_avant: produit.stock_actuel,
            stock_apres: nouvelleQuantite,
            reference: formData.numero_lot,
            motif: 'Nouveau lot reçu',
            user_id: profile.id,
          },
        ]);

      await supabase
        .from('produits')
        .update({ stock_actuel: nouvelleQuantite })
        .eq('id', formData.produit_id);

      alert('Lot ajouté avec succès!');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      produit_id: '',
      fournisseur_id: '',
      numero_lot: '',
      quantite_initiale: 0,
      date_fabrication: '',
      date_expiration: '',
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'BON':
        return 'bg-green-100 text-green-700';
      case 'PROCHE_EXPIRATION':
        return 'bg-orange-100 text-orange-700';
      case 'EXPIRE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDaysUntilExpiration = (dateExpiration: string | null) => {
    if (!dateExpiration) return null;
    const today = new Date();
    const expDate = new Date(dateExpiration);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Lots</h1>
          <p className="text-gray-600 mt-1">{lots.length} lots enregistrés</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau lot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lots en bon état</p>
              <p className="text-2xl font-bold text-gray-800">
                {lots.filter((l) => l.statut === 'BON').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Proche expiration</p>
              <p className="text-2xl font-bold text-gray-800">
                {lots.filter((l) => l.statut === 'PROCHE_EXPIRATION').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lots expirés</p>
              <p className="text-2xl font-bold text-gray-800">
                {lots.filter((l) => l.statut === 'EXPIRE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Nouveau Lot</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produit *</label>
                <select
                  required
                  value={formData.produit_id}
                  onChange={(e) => setFormData({ ...formData, produit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map((produit) => (
                    <option key={produit.id} value={produit.id}>
                      {produit.nom} (Stock: {produit.stock_actuel} {produit.unite_mesure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
                <select
                  value={formData.fournisseur_id}
                  onChange={(e) => setFormData({ ...formData, fournisseur_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun fournisseur</option>
                  {fournisseurs.map((fournisseur) => (
                    <option key={fournisseur.id} value={fournisseur.id}>
                      {fournisseur.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de lot *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_lot}
                    onChange={(e) => setFormData({ ...formData, numero_lot: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="LOT-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={formData.quantite_initiale}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite_initiale: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fabrication
                  </label>
                  <input
                    type="date"
                    value={formData.date_fabrication}
                    onChange={(e) =>
                      setFormData({ ...formData, date_fabrication: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    value={formData.date_expiration}
                    onChange={(e) =>
                      setFormData({ ...formData, date_expiration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Créer le lot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lots.map((lot) => {
          const daysUntilExpiration = getDaysUntilExpiration(lot.date_expiration);
          const percentageRemaining = lot.quantite_initiale
            ? (lot.quantite_restante / lot.quantite_initiale) * 100
            : 0;

          return (
            <div
              key={lot.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {lot.produit && (
                    <h3 className="font-bold text-gray-800">{lot.produit.nom}</h3>
                  )}
                  <p className="text-sm text-gray-600">Lot: {lot.numero_lot}</p>
                  {lot.fournisseur && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fournisseur: {lot.fournisseur.nom}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatutColor(
                    lot.statut
                  )}`}
                >
                  {lot.statut}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Quantité restante</span>
                    <span className="font-bold text-gray-800">
                      {lot.quantite_restante} / {lot.quantite_initiale}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentageRemaining > 50
                          ? 'bg-green-500'
                          : percentageRemaining > 25
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentageRemaining}%` }}
                    ></div>
                  </div>
                </div>

                {lot.date_fabrication && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fabrication</span>
                    <span className="text-gray-800">
                      {new Date(lot.date_fabrication).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {lot.date_expiration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expiration</span>
                    <div className="text-right">
                      <span
                        className={`font-medium ${
                          lot.statut === 'EXPIRE'
                            ? 'text-red-600'
                            : lot.statut === 'PROCHE_EXPIRATION'
                            ? 'text-orange-600'
                            : 'text-gray-800'
                        }`}
                      >
                        {new Date(lot.date_expiration).toLocaleDateString('fr-FR')}
                      </span>
                      {daysUntilExpiration !== null && daysUntilExpiration >= 0 && (
                        <p className="text-xs text-gray-500">
                          Dans {daysUntilExpiration} jour{daysUntilExpiration !== 1 ? 's' : ''}
                        </p>
                      )}
                      {daysUntilExpiration !== null && daysUntilExpiration < 0 && (
                        <p className="text-xs text-red-600">
                          Expiré depuis {Math.abs(daysUntilExpiration)} jour
                          {Math.abs(daysUntilExpiration) !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun lot enregistré</p>
        </div>
      )}
    </div>
  );
}
