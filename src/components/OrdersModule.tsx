import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Commande, Client, Livreur, Profile, Produit, CommandeItem, Paiement } from '../types';
import { Plus, Eye, DollarSign, Truck, CheckCircle, Clock, X, Trash2, ShoppingCart, CreditCard } from 'lucide-react';

interface OrdersModuleProps {
  profile: Profile;
}

export default function OrdersModule({ profile }: OrdersModuleProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [commandeItems, setCommandeItems] = useState<CommandeItem[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    notes: '',
  });

  const [cartItems, setCartItems] = useState<Array<{ produit_id: string; quantite: number; prix_unitaire: number }>>([]);

  const [paymentFormData, setPaymentFormData] = useState({
    montant: 0,
    mode_paiement: 'CASH',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [commandesRes, clientsRes, livreursRes, produitsRes] = await Promise.all([
        supabase
          .from('commandes')
          .select('*, client:clients(*), livreur:livreurs(*)')
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('actif', true),
        supabase.from('livreurs').select('*').eq('actif', true),
        supabase.from('produits').select('*').eq('actif', true).order('nom'),
      ]);

      if (commandesRes.data) setCommandes(commandesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (livreursRes.data) setLivreurs(livreursRes.data);
      if (produitsRes.data) setProduits(produitsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommandeDetails = async (commandeId: string) => {
    try {
      const [itemsRes, paiementsRes] = await Promise.all([
        supabase
          .from('commande_items')
          .select('*, produit:produits(*)')
          .eq('commande_id', commandeId),
        supabase
          .from('paiements')
          .select('*')
          .eq('commande_id', commandeId)
          .order('date_paiement', { ascending: false }),
      ]);

      if (itemsRes.data) setCommandeItems(itemsRes.data);
      if (paiementsRes.data) setPaiements(paiementsRes.data);
    } catch (error) {
      console.error('Error loading commande details:', error);
    }
  };

  const handleAddToCart = () => {
    setCartItems([...cartItems, { produit_id: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleUpdateCartItem = (index: number, field: string, value: any) => {
    const updated = [...cartItems];
    if (field === 'produit_id') {
      const produit = produits.find(p => p.id === value);
      if (produit) {
        updated[index].produit_id = value;
        updated[index].prix_unitaire = produit.prix_unitaire;
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCartItems(updated);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Veuillez ajouter au moins un produit');
      return;
    }

    if (!formData.client_id) {
      alert('Veuillez sélectionner un client');
      return;
    }

    try {
      const numeroCommande = `CMD-${Date.now()}`;
      const montantTotal = calculateTotal();

      const { data: commandeData, error: commandeError } = await supabase
        .from('commandes')
        .insert([{
          numero_commande: numeroCommande,
          client_id: formData.client_id,
          montant_total: montantTotal,
          montant_paye: 0,
          montant_restant: montantTotal,
          statut_livraison: 'EN_ATTENTE',
          statut_paiement: 'NON_PAYE',
          notes: formData.notes,
          user_id: profile.id,
        }])
        .select()
        .single();

      if (commandeError) throw commandeError;

      const items = cartItems.map(item => ({
        commande_id: commandeData.id,
        produit_id: item.produit_id,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        montant: item.quantite * item.prix_unitaire,
      }));

      const { error: itemsError } = await supabase
        .from('commande_items')
        .insert(items);

      if (itemsError) throw itemsError;

      for (const item of cartItems) {
        const { data: produit } = await supabase
          .from('produits')
          .select('stock_actuel')
          .eq('id', item.produit_id)
          .single();

        if (produit) {
          await supabase
            .from('mouvements_stock')
            .insert([{
              produit_id: item.produit_id,
              type_mouvement: 'SORTIE',
              quantite: item.quantite,
              stock_avant: produit.stock_actuel,
              stock_apres: produit.stock_actuel - item.quantite,
              reference: numeroCommande,
              motif: 'Commande client',
              user_id: profile.id,
            }]);

          await supabase
            .from('produits')
            .update({ stock_actuel: produit.stock_actuel - item.quantite })
            .eq('id', item.produit_id);
        }
      }

      alert('Commande créée avec succès!');
      setShowForm(false);
      setFormData({ client_id: '', notes: '' });
      setCartItems([]);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCommande) return;

    try {
      const { error: paymentError } = await supabase
        .from('paiements')
        .insert([{
          commande_id: selectedCommande.id,
          montant: paymentFormData.montant,
          mode_paiement: paymentFormData.mode_paiement,
          reference: paymentFormData.reference,
          notes: paymentFormData.notes,
          user_id: profile.id,
        }]);

      if (paymentError) throw paymentError;

      const nouveauMontantPaye = selectedCommande.montant_paye + paymentFormData.montant;
      const nouveauMontantRestant = selectedCommande.montant_total - nouveauMontantPaye;
      const nouveauStatut = nouveauMontantRestant === 0 ? 'PAYE' : nouveauMontantRestant < selectedCommande.montant_total ? 'PARTIEL' : 'NON_PAYE';

      const { error: updateError } = await supabase
        .from('commandes')
        .update({
          montant_paye: nouveauMontantPaye,
          montant_restant: nouveauMontantRestant,
          statut_paiement: nouveauStatut,
        })
        .eq('id', selectedCommande.id);

      if (updateError) throw updateError;

      alert('Paiement enregistré avec succès!');
      setShowPaymentForm(false);
      setPaymentFormData({ montant: 0, mode_paiement: 'CASH', reference: '', notes: '' });
      loadData();
      if (selectedCommande) {
        loadCommandeDetails(selectedCommande.id);
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const viewDetails = (commande: Commande) => {
    setSelectedCommande(commande);
    loadCommandeDetails(commande.id);
    setShowDetail(true);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-700';
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-700';
      case 'LIVREE':
        return 'bg-green-100 text-green-700';
      case 'ANNULEE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (statut: string) => {
    switch (statut) {
      case 'PAYE':
        return 'bg-emerald-100 text-emerald-700';
      case 'PARTIEL':
        return 'bg-orange-100 text-orange-700';
      case 'NON_PAYE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCommandes = commandes.filter((c) =>
    filter === 'all' || c.statut_livraison === filter
  );

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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Commandes</h1>
          <p className="text-gray-600 mt-1">{commandes.length} commandes totales</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvelle commande</span>
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'EN_ATTENTE', 'EN_COURS', 'LIVREE'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'Toutes' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Nouvelle Commande</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client (Hôtel) *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Produits commandés</h3>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Ajouter un produit</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.produit_id}
                        onChange={(e) => handleUpdateCartItem(index, 'produit_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un produit</option>
                        {produits.map((produit) => (
                          <option key={produit.id} value={produit.id}>
                            {produit.nom} ({produit.stock_actuel} {produit.unite_mesure} disponible)
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        value={item.quantite}
                        onChange={(e) => handleUpdateCartItem(index, 'quantite', parseFloat(e.target.value) || 0)}
                        placeholder="Qté"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />

                      <input
                        type="number"
                        step="0.01"
                        value={item.prix_unitaire}
                        onChange={(e) => handleUpdateCartItem(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                        placeholder="Prix"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(index)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>

                {cartItems.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {calculateTotal().toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Créer la commande
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedCommande.numero_commande}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCommande.client?.nom}
                </p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCommande.statut_livraison)}`}>
                    {selectedCommande.statut_livraison}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedCommande.statut_paiement)}`}>
                    {selectedCommande.statut_paiement}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3">Produits commandés</h3>
                <div className="space-y-2">
                  {commandeItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.produit?.nom}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantite} × {item.prix_unitaire.toLocaleString()} USD
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">{item.montant.toLocaleString()} USD</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Paiements</h3>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Ajouter un paiement</span>
                  </button>
                </div>

                {paiements.length > 0 ? (
                  <div className="space-y-2">
                    {paiements.map((paiement) => (
                      <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{paiement.montant.toLocaleString()} USD</p>
                          <p className="text-sm text-gray-600">
                            {paiement.mode_paiement} - {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {paiement.reference && (
                          <p className="text-sm text-gray-600">Réf: {paiement.reference}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun paiement enregistré</p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-xl font-bold text-gray-800">
                      {selectedCommande.montant_total.toLocaleString()} USD
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant payé</p>
                    <p className="text-xl font-bold text-green-600">
                      {selectedCommande.montant_paye.toLocaleString()} USD
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Montant restant</p>
                    <p className="text-xl font-bold text-orange-600">
                      {selectedCommande.montant_restant.toLocaleString()} USD
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Ajouter un paiement</h2>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (USD) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={selectedCommande.montant_restant}
                  value={paymentFormData.montant}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, montant: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Montant restant: {selectedCommande.montant_restant.toLocaleString()} USD
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement *</label>
                <select
                  required
                  value={paymentFormData.mode_paiement}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, mode_paiement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Espèces (CASH)</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANQUE">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
                <input
                  type="text"
                  value={paymentFormData.reference}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Numéro de transaction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredCommandes.map((commande) => (
          <div
            key={commande.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {commande.numero_commande}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(commande.statut_livraison)}`}>
                    {commande.statut_livraison}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(commande.statut_paiement)}`}>
                    {commande.statut_paiement}
                  </span>
                </div>
                {commande.client && (
                  <p className="text-sm text-gray-600">
                    Client: <span className="font-medium">{commande.client.nom}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => viewDetails(commande)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="font-bold text-gray-800">{commande.montant_total.toLocaleString()} USD</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payé</p>
                  <p className="font-bold text-gray-800">{commande.montant_paye.toLocaleString()} USD</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock size={16} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Restant</p>
                  <p className="font-bold text-gray-800">{commande.montant_restant.toLocaleString()} USD</p>
                </div>
              </div>

              {commande.livreur && (
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Truck size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Livreur</p>
                    <p className="font-bold text-gray-800">{commande.livreur.nom}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Créée le {new Date(commande.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {commande.notes && (
                <span className="text-gray-600 italic">{commande.notes}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCommandes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
