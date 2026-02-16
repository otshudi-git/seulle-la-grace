import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductsModule from './components/ProductsModule';
import SuppliersModule from './components/SuppliersModule';
import ClientsModule from './components/ClientsModule';
import OrdersModule from './components/OrdersModule';
import DeliveriesModule from './components/DeliveriesModule';
import ReportsModule from './components/ReportsModule';
import StockLotsModule from './components/StockLotsModule';
import {
  Package,
  Users,
  Truck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Warehouse,
  LogOut,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Login />;
  }

  const modules = [
    { id: 'dashboard', name: 'Tableau de bord', icon: BarChart3, roles: ['ADMIN', 'MAGASINIER', 'CAISSIER'] },
    { id: 'products', name: 'Produits', icon: Package, roles: ['ADMIN', 'MAGASINIER'] },
    { id: 'stock', name: 'Stock & Lots', icon: Warehouse, roles: ['ADMIN', 'MAGASINIER'] },
    { id: 'suppliers', name: 'Fournisseurs', icon: Truck, roles: ['ADMIN', 'MAGASINIER'] },
    { id: 'clients', name: 'Clients (Hôtels)', icon: Users, roles: ['ADMIN', 'MAGASINIER', 'CAISSIER'] },
    { id: 'orders', name: 'Commandes', icon: ShoppingCart, roles: ['ADMIN', 'MAGASINIER', 'CAISSIER'] },
    { id: 'deliveries', name: 'Livraisons', icon: TrendingUp, roles: ['ADMIN', 'MAGASINIER', 'LIVREUR'] },
    { id: 'reports', name: 'Rapports', icon: BarChart3, roles: ['ADMIN', 'MAGASINIER', 'CAISSIER'] },
  ];

  const filteredModules = modules.filter(module =>
    module.roles.includes(profile.role)
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard profile={profile} />;
      case 'products':
        return <ProductsModule profile={profile} />;
      case 'stock':
        return <StockLotsModule profile={profile} />;
      case 'suppliers':
        return <SuppliersModule profile={profile} />;
      case 'clients':
        return <ClientsModule profile={profile} />;
      case 'orders':
        return <OrdersModule profile={profile} />;
      case 'deliveries':
        return <DeliveriesModule profile={profile} />;
      case 'reports':
        return <ReportsModule profile={profile} />;
      default:
        return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src="/LOGO.jpg" alt="Logo" className="h-12 w-12 rounded-lg object-cover" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">Seule La Grâce</h1>
              <p className="text-xs text-gray-500">Gestion de Stock</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeModule === module.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{module.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Connecté en tant que</p>
            <p className="text-sm font-medium text-gray-800">
              {profile.prenom} {profile.nom}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">{profile.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {profile.prenom} {profile.nom}
                </p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {profile.prenom[0]}{profile.nom[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

export default App;
