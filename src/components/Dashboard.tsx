import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Clock
} from 'lucide-react';

interface DashboardProps {
  profile: Profile;
}

interface Stats {
  totalProduits: number;
  produitsEnRupture: number;
  totalClients: number;
  commandesEnCours: number;
  commandesLivrees: number;
  commandesNonPayees: number;
  montantTotal: number;
  montantRestant: number;
  produitsProchesExpiration: number;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalProduits: 0,
    produitsEnRupture: 0,
    totalClients: 0,
    commandesEnCours: 0,
    commandesLivrees: 0,
    commandesNonPayees: 0,
    montantTotal: 0,
    montantRestant: 0,
    produitsProchesExpiration: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        produitsResult,
        clientsResult,
        commandesResult,
        lotsResult
      ] = await Promise.all([
        supabase.from('produits').select('stock_actuel, stock_minimum', { count: 'exact' }),
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('commandes').select('statut_livraison, statut_paiement, montant_total, montant_restant'),
        supabase.from('lots_produits').select('statut', { count: 'exact' }).eq('statut', 'PROCHE_EXPIRATION'),
      ]);

      const produits = produitsResult.data || [];
      const commandes = commandesResult.data || [];

      const produitsEnRupture = produits.filter(p => p.stock_actuel <= p.stock_minimum).length;
      const commandesEnCours = commandes.filter(c => c.statut_livraison === 'EN_COURS').length;
      const commandesLivrees = commandes.filter(c => c.statut_livraison === 'LIVREE').length;
      const commandesNonPayees = commandes.filter(c => c.statut_paiement !== 'PAYE').length;

      const montantTotal = commandes.reduce((sum, c) => sum + (c.montant_total || 0), 0);
      const montantRestant = commandes.reduce((sum, c) => sum + (c.montant_restant || 0), 0);

      setStats({
        totalProduits: produits.length,
        produitsEnRupture,
        totalClients: clientsResult.count || 0,
        commandesEnCours,
        commandesLivrees,
        commandesNonPayees,
        montantTotal,
        montantRestant,
        produitsProchesExpiration: lotsResult.count || 0,
      });
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

  const statCards = [
    {
      title: 'Produits en stock',
      value: stats.totalProduits,
      icon: Package,
      color: 'bg-blue-500',
      trend: `${stats.produitsEnRupture} en rupture`,
      trendColor: stats.produitsEnRupture > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'Clients actifs',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-green-500',
      trend: 'Hôtels partenaires',
      trendColor: 'text-gray-600',
    },
    {
      title: 'Livraisons en cours',
      value: stats.commandesEnCours,
      icon: Truck,
      color: 'bg-orange-500',
      trend: `${stats.commandesLivrees} livrées`,
      trendColor: 'text-gray-600',
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.montantTotal.toLocaleString()} USD`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: `${stats.montantRestant.toLocaleString()} USD impayés`,
      trendColor: stats.montantRestant > 0 ? 'text-orange-600' : 'text-green-600',
    },
  ];

  const alerts = [];
  if (stats.produitsEnRupture > 0) {
    alerts.push({
      type: 'warning',
      message: `${stats.produitsEnRupture} produit(s) en rupture de stock`,
      icon: AlertTriangle,
    });
  }
  if (stats.produitsProchesExpiration > 0) {
    alerts.push({
      type: 'warning',
      message: `${stats.produitsProchesExpiration} lot(s) proche(s) de l'expiration`,
      icon: Clock,
    });
  }
  if (stats.commandesNonPayees > 0) {
    alerts.push({
      type: 'info',
      message: `${stats.commandesNonPayees} commande(s) avec paiement en attente`,
      icon: ShoppingCart,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Bonjour, {profile.prenom}
        </h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mb-2">{card.value}</p>
                  <p className={`text-xs font-medium ${card.trendColor}`}>
                    {card.trend}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Alertes et notifications</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg ${
                    alert.type === 'warning'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Icon
                    size={20}
                    className={alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'}
                  />
                  <p
                    className={`text-sm font-medium ${
                      alert.type === 'warning' ? 'text-orange-700' : 'text-blue-700'
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Activité récente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Système démarré avec succès</p>
                <p className="text-xs text-gray-500">Prêt à gérer vos stocks et livraisons</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-lg font-bold mb-2">Bienvenue dans votre espace</h2>
          <p className="text-sm opacity-90 mb-4">
            Gérez efficacement vos stocks, commandes et livraisons vers les hôtels partenaires.
          </p>
          <div className="flex items-center space-x-2 text-sm opacity-90">
            <Package size={16} />
            <span>Système professionnel de gestion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
