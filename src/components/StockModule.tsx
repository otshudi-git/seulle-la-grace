import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LotProduit, Produit, Profile, MouvementStock } from '../types';
import { Package, AlertTriangle, Calendar, TrendingDown } from 'lucide-react';

interface StockModuleProps {
  profile: Profile;
}

export default function StockModule({ profile }: StockModuleProps) {
  const [lots, setLots] = useState<LotProduit[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lots' | 'mouvements' | 'pertes'>('lots');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lotsRes, mouvementsRes] = await Promise.all([
        supabase
          .from('lots_produits')
          .select('*, produit:produits(*)')
          .order('date_expiration'),
        supabase
          .from('mouvements_stock')
          .select('*, produit:produits(*)')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (lotsRes.data) setLots(lotsRes.data);
      if (mouvementsRes.data) setMouvements(mouvementsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

  const getMouvementColor = (type: string) => {
    switch (type) {
      case 'ENTREE':
        return 'text-green-600 bg-green-50';
      case 'SORTIE':
        return 'text-blue-600 bg-blue-50';
      case 'PERTE':
        return 'text-red-600 bg-red-50';
      case 'AJUSTEMENT':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Stocks</h1>
        <p className="text-gray-600 mt-1">Suivi des lots et mouvements de stock</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'lots', name: 'Lots de produits' },
          { id: 'mouvements', name: 'Mouvements' },
          { id: 'pertes', name: 'Pertes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'lots' && (
        <div className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {lot.produit && (
                      <h3 className="font-bold text-gray-800">{lot.produit.nom}</h3>
                    )}
                    <p className="text-sm text-gray-600">Lot: {lot.numero_lot}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatutColor(lot.statut)}`}>
                    {lot.statut}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité restante</span>
                    <span className="font-bold text-gray-800">
                      {lot.quantite_restante} / {lot.quantite_initiale}
                    </span>
                  </div>

                  {lot.date_fabrication && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fabrication</span>
                      <span className="text-gray-800">
                        {new Date(lot.date_fabrication).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {lot.date_expiration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiration</span>
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
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucun lot enregistré</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mouvements' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Historique des mouvements</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {mouvements.map((mouvement) => (
                <div key={mouvement.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getMouvementColor(
                          mouvement.type_mouvement
                        )}`}
                      >
                        {mouvement.type_mouvement}
                      </span>

                      <div className="flex-1">
                        {mouvement.produit && (
                          <p className="font-medium text-gray-800">{mouvement.produit.nom}</p>
                        )}
                        {mouvement.motif && (
                          <p className="text-sm text-gray-600">{mouvement.motif}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {mouvement.type_mouvement === 'ENTREE' ? '+' : '-'}
                        {mouvement.quantite}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {mouvement.stock_avant} → {mouvement.stock_apres}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(mouvement.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mouvements.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <TrendingDown size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucun mouvement enregistré</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pertes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center text-gray-500">
            <TrendingDown size={48} className="mx-auto mb-4 opacity-50" />
            <p>Module de gestion des pertes</p>
            <p className="text-sm mt-2">Fonctionnalité à venir</p>
          </div>
        </div>
      )}
    </div>
  );
}
