import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Commande, Livreur, Profile } from '../types';
import { Truck, Package, CheckCircle, Clock, MapPin, User, X } from 'lucide-react';

interface DeliveriesModuleProps {
  profile: Profile;
}

export default function DeliveriesModule({ profile }: DeliveriesModuleProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'EN_ATTENTE' | 'EN_COURS' | 'LIVREE'>('EN_ATTENTE');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [selectedLivreur, setSelectedLivreur] = useState('');
  const [confirmationNotes, setConfirmationNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [commandesRes, livreursRes] = await Promise.all([
        supabase
          .from('commandes')
          .select('*, client:clients(*), livreur:livreurs(*)')
          .in('statut_livraison', ['EN_ATTENTE', 'EN_COURS', 'LIVREE'])
          .order('created_at', { ascending: false }),
        supabase.from('livreurs').select('*').eq('actif', true).order('nom'),
      ]);

      if (commandesRes.data) setCommandes(commandesRes.data);
      if (livreursRes.data) setLivreurs(livreursRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLivreur = async () => {
    if (!selectedCommande || !selectedLivreur) return;

    try {
      const { error } = await supabase
        .from('commandes')
        .update({
          livreur_id: selectedLivreur,
          statut_livraison: 'EN_COURS',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCommande.id);

      if (error) throw error;

      alert('Livreur assigné avec succès!');
      setShowAssignForm(false);
      setSelectedCommande(null);
      setSelectedLivreur('');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedCommande) return;

    try {
      const { error} = await supabase
        .from('commandes')
        .update({
          statut_livraison: 'LIVREE',
          date_livraison: new Date().toISOString(),
          notes_livraison: confirmationNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCommande.id);

      if (error) throw error;

      alert('Livraison confirmée avec succès!');
      setShowConfirmForm(false);
      setSelectedCommande(null);
      setConfirmationNotes('');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const openAssignForm = (commande: Commande) => {
    setSelectedCommande(commande);
    setSelectedLivreur(commande.livreur_id || '');
    setShowAssignForm(true);
  };

  const openConfirmForm = (commande: Commande) => {
    setSelectedCommande(commande);
    setConfirmationNotes('');
    setShowConfirmForm(true);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-700';
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-700';
      case 'LIVREE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCommandes = commandes.filter((c) => c.statut_livraison === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Livraisons</h1>
        <p className="text-gray-600 mt-1">Suivi et gestion des livraisons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-800">
                {commandes.filter((c) => c.statut_livraison === 'EN_ATTENTE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-800">
                {commandes.filter((c) => c.statut_livraison === 'EN_COURS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Livrées</p>
              <p className="text-2xl font-bold text-gray-800">
                {commandes.filter((c) => c.statut_livraison === 'LIVREE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['EN_ATTENTE', 'EN_COURS', 'LIVREE'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {showAssignForm && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Assigner un livreur</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedCommande.numero_commande}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Livreur *
                </label>
                <select
                  value={selectedLivreur}
                  onChange={(e) => setSelectedLivreur(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un livreur</option>
                  {livreurs.map((livreur) => (
                    <option key={livreur.id} value={livreur.id}>
                      {livreur.nom} - {livreur.telephone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAssignLivreur}
                  disabled={!selectedLivreur}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assigner
                </button>
                <button
                  onClick={() => {
                    setShowAssignForm(false);
                    setSelectedCommande(null);
                    setSelectedLivreur('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmForm && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Confirmer la livraison</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedCommande.numero_commande}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Client:</strong> {selectedCommande.client?.nom}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Livreur:</strong> {selectedCommande.livreur?.nom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de livraison
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Commentaires sur la livraison..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmDelivery}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Confirmer la livraison
                </button>
                <button
                  onClick={() => {
                    setShowConfirmForm(false);
                    setSelectedCommande(null);
                    setConfirmationNotes('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      commande.statut_livraison
                    )}`}
                  >
                    {commande.statut_livraison}
                  </span>
                </div>

                <div className="space-y-1">
                  {commande.client && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>
                        <strong>Client:</strong> {commande.client.nom}
                      </span>
                    </div>
                  )}

                  {commande.livreur && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User size={14} />
                      <span>
                        <strong>Livreur:</strong> {commande.livreur.nom} -{' '}
                        {commande.livreur.telephone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package size={14} />
                    <span>
                      <strong>Montant:</strong> {commande.montant_total.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {commande.statut_livraison === 'EN_ATTENTE' && (
                  <button
                    onClick={() => openAssignForm(commande)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Assigner livreur
                  </button>
                )}

                {commande.statut_livraison === 'EN_COURS' && (
                  <button
                    onClick={() => openConfirmForm(commande)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Confirmer livraison
                  </button>
                )}

                {commande.statut_livraison === 'LIVREE' && commande.date_livraison && (
                  <div className="text-sm text-gray-600 text-right">
                    <p className="font-medium text-green-600">Livrée</p>
                    <p className="text-xs">
                      {new Date(commande.date_livraison).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {commande.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {commande.notes}
                </p>
              </div>
            )}

            {commande.notes_livraison && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Notes de livraison:</strong> {commande.notes_livraison}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCommandes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Truck size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune livraison trouvée</p>
        </div>
      )}
    </div>
  );
}
