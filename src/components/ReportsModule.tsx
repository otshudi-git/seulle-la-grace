import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Download,
  Calendar,
} from 'lucide-react';

interface ReportsModuleProps {
  profile: Profile;
}

interface ReportStats {
  totalVentes: number;
  totalCommandes: number;
  commandesLivrees: number;
  commandesNonPayees: number;
  produitsVendus: number;
  clientsActifs: number;
  montantRecouvre: number;
  montantRestant: number;
}

export default function ReportsModule({ profile }: ReportsModuleProps) {
  const [stats, setStats] = useState<ReportStats>({
    totalVentes: 0,
    totalCommandes: 0,
    commandesLivrees: 0,
    commandesNonPayees: 0,
    produitsVendus: 0,
    clientsActifs: 0,
    montantRecouvre: 0,
    montantRestant: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStats();
  }, [periode]);

  const loadStats = async () => {
    try {
      const { data: commandes } = await supabase
        .from('commandes')
        .select('statut_livraison, statut_paiement, montant_total, montant_paye, montant_restant');

      const { data: commandeItems } = await supabase
        .from('commande_items')
        .select('quantite');

      const { data: clients } = await supabase
        .from('clients')
        .select('id', { count: 'exact' });

      if (commandes) {
        const totalVentes = commandes.reduce((sum, c) => sum + c.montant_total, 0);
        const commandesLivrees = commandes.filter((c) => c.statut_livraison === 'LIVREE').length;
        const commandesNonPayees = commandes.filter((c) => c.statut_paiement !== 'PAYE').length;
        const montantRecouvre = commandes.reduce((sum, c) => sum + c.montant_paye, 0);
        const montantRestant = commandes.reduce((sum, c) => sum + c.montant_restant, 0);

        const produitsVendus = commandeItems
          ? commandeItems.reduce((sum, item) => sum + item.quantite, 0)
          : 0;

        setStats({
          totalVentes,
          totalCommandes: commandes.length,
          commandesLivrees,
          commandesNonPayees,
          produitsVendus,
          clientsActifs: clients?.length || 0,
          montantRecouvre,
          montantRestant,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const reportCards = [
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalVentes.toLocaleString()} USD`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      subtitle: `${stats.montantRecouvre.toLocaleString()} USD récupérés`,
    },
    {
      title: 'Commandes totales',
      value: stats.totalCommandes,
      icon: BarChart3,
      color: 'bg-blue-500',
      subtitle: `${stats.commandesLivrees} livrées`,
    },
    {
      title: 'Produits vendus',
      value: stats.produitsVendus,
      icon: Package,
      color: 'bg-purple-500',
      subtitle: 'Toutes catégories',
    },
    {
      title: 'Clients actifs',
      value: stats.clientsActifs,
      icon: Users,
      color: 'bg-orange-500',
      subtitle: 'Hôtels partenaires',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports et Statistiques</h1>
          <p className="text-gray-600 mt-1">Analyse de l'activité commerciale</p>
        </div>

        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Download size={20} />
          <span>Exporter PDF</span>
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'today', name: "Aujourd'hui" },
          { id: 'week', name: 'Cette semaine' },
          { id: 'month', name: 'Ce mois' },
          { id: 'year', name: 'Cette année' },
        ].map((period) => (
          <button
            key={period.id}
            onClick={() => setPeriode(period.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periode === period.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {period.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-800">Performance commerciale</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Taux de livraison</p>
                <p className="text-lg font-bold text-gray-800">
                  {stats.totalCommandes > 0
                    ? Math.round((stats.commandesLivrees / stats.totalCommandes) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Taux de recouvrement</p>
                <p className="text-lg font-bold text-gray-800">
                  {stats.totalVentes > 0
                    ? Math.round((stats.montantRecouvre / stats.totalVentes) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Commandes non payées</p>
                <p className="text-lg font-bold text-red-600">{stats.commandesNonPayees}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <Calendar size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-800">Créances et impayés</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Montant récupéré</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.montantRecouvre.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      stats.totalVentes > 0
                        ? (stats.montantRecouvre / stats.totalVentes) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Montant restant</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.montantRestant.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      stats.totalVentes > 0
                        ? (stats.montantRestant / stats.totalVentes) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">Total à facturer</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.totalVentes.toLocaleString()} USD
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
