import { useState } from 'react';
import { FileSpreadsheet, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface ModuleReportsProps {
  module: 'products' | 'clients' | 'suppliers' | 'orders' | 'deliveries' | 'lots';
  onClose: () => void;
}

export default function ModuleReports({ module, onClose }: ModuleReportsProps) {
  const [loading, setLoading] = useState(false);

  const getModuleTitle = () => {
    const titles = {
      products: 'Produits',
      clients: 'Clients',
      suppliers: 'Fournisseurs',
      orders: 'Commandes',
      deliveries: 'Livraisons',
      lots: 'Lots de Stock',
    };
    return titles[module];
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let exportData: any[] = [];

      switch (module) {
        case 'products':
          const { data: products } = await supabase
            .from('produits')
            .select('nom, reference, prix_unitaire, stock_minimum, categorie:categories(nom)');

          exportData = products?.map((p: any) => ({
            'Nom': p.nom,
            'Référence': p.reference,
            'Catégorie': p.categorie?.nom || 'N/A',
            'Prix Vente (USD)': p.prix_unitaire,
            'Stock Minimum': p.stock_minimum,
          })) || [];
          break;

        case 'clients':
          const { data: clients } = await supabase
            .from('clients')
            .select('nom, email, telephone, adresse, type_client');

          exportData = clients?.map((c: any) => ({
            'Nom': c.nom,
            'Email': c.email || 'N/A',
            'Téléphone': c.telephone || 'N/A',
            'Adresse': c.adresse || 'N/A',
            'Type': c.type_client,
          })) || [];
          break;

        case 'suppliers':
          const { data: suppliers } = await supabase
            .from('fournisseurs')
            .select('nom, email, telephone, adresse, actif');

          exportData = suppliers?.map((s: any) => ({
            'Nom': s.nom,
            'Email': s.email || 'N/A',
            'Téléphone': s.telephone || 'N/A',
            'Adresse': s.adresse || 'N/A',
            'Statut': s.actif ? 'Actif' : 'Inactif',
          })) || [];
          break;

        case 'orders':
          const { data: orders } = await supabase
            .from('commandes')
            .select('numero_commande, date_commande, montant_total, montant_paye, montant_restant, statut_livraison, statut_paiement, client:clients(nom)');

          exportData = orders?.map((o: any) => ({
            'Numéro': o.numero_commande,
            'Date': new Date(o.date_commande).toLocaleDateString('fr-FR'),
            'Client': o.client?.nom || 'N/A',
            'Montant Total (USD)': o.montant_total,
            'Payé (USD)': o.montant_paye,
            'Restant (USD)': o.montant_restant,
            'Livraison': o.statut_livraison,
            'Paiement': o.statut_paiement,
          })) || [];
          break;

        case 'deliveries':
          const { data: deliveries } = await supabase
            .from('livraisons')
            .select('numero_livraison, date_livraison, statut, commande:commandes(numero_commande, client:clients(nom))');

          exportData = deliveries?.map((d: any) => ({
            'Numéro Livraison': d.numero_livraison,
            'Date': new Date(d.date_livraison).toLocaleDateString('fr-FR'),
            'Commande': d.commande?.numero_commande || 'N/A',
            'Client': d.commande?.client?.nom || 'N/A',
            'Statut': d.statut,
          })) || [];
          break;

        case 'lots':
          const { data: lots } = await supabase
            .from('lots_produits')
            .select('numero_lot, quantite_initiale, quantite_restante, prix_achat_unitaire, date_fabrication, date_expiration, statut, produit:produits(nom, prix_unitaire), fournisseur:fournisseurs(nom)');

          exportData = lots?.map((l: any) => ({
            'Numéro Lot': l.numero_lot,
            'Produit': l.produit?.nom || 'N/A',
            'Fournisseur': l.fournisseur?.nom || 'N/A',
            'Quantité Initiale': l.quantite_initiale,
            'Quantité Restante': l.quantite_restante,
            'Prix Achat (USD)': l.prix_achat_unitaire,
            'Prix Vente (USD)': l.produit?.prix_unitaire || 0,
            'Marge (%)': l.produit?.prix_unitaire && l.prix_achat_unitaire
              ? ((l.produit.prix_unitaire - l.prix_achat_unitaire) / l.prix_achat_unitaire * 100).toFixed(2)
              : 'N/A',
            'Date Fabrication': l.date_fabrication ? new Date(l.date_fabrication).toLocaleDateString('fr-FR') : 'N/A',
            'Date Expiration': l.date_expiration ? new Date(l.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
            'Statut': l.statut,
          })) || [];
          break;
      }

      exportToExcel(exportData, `rapport_${module}`, getModuleTitle());
      alert('Export Excel réussi!');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      let headers: string[] = [];
      let data: any[][] = [];

      switch (module) {
        case 'products':
          const { data: products } = await supabase
            .from('produits')
            .select('nom, reference, prix_unitaire, stock_minimum, categorie:categories(nom)');

          headers = ['Nom', 'Référence', 'Catégorie', 'Prix Vente', 'Stock Min'];
          data = products?.map((p: any) => [
            p.nom,
            p.reference,
            p.categorie?.nom || 'N/A',
            `${p.prix_unitaire} USD`,
            p.stock_minimum.toString(),
          ]) || [];
          break;

        case 'clients':
          const { data: clients } = await supabase
            .from('clients')
            .select('nom, email, telephone, type_client');

          headers = ['Nom', 'Email', 'Téléphone', 'Type'];
          data = clients?.map((c: any) => [
            c.nom,
            c.email || 'N/A',
            c.telephone || 'N/A',
            c.type_client,
          ]) || [];
          break;

        case 'suppliers':
          const { data: suppliers } = await supabase
            .from('fournisseurs')
            .select('nom, email, telephone, actif');

          headers = ['Nom', 'Email', 'Téléphone', 'Statut'];
          data = suppliers?.map((s: any) => [
            s.nom,
            s.email || 'N/A',
            s.telephone || 'N/A',
            s.actif ? 'Actif' : 'Inactif',
          ]) || [];
          break;

        case 'orders':
          const { data: orders } = await supabase
            .from('commandes')
            .select('numero_commande, date_commande, montant_total, statut_livraison, client:clients(nom)');

          headers = ['Numéro', 'Date', 'Client', 'Montant', 'Statut'];
          data = orders?.map((o: any) => [
            o.numero_commande,
            new Date(o.date_commande).toLocaleDateString('fr-FR'),
            o.client?.nom || 'N/A',
            `${o.montant_total} USD`,
            o.statut_livraison,
          ]) || [];
          break;

        case 'deliveries':
          const { data: deliveries } = await supabase
            .from('livraisons')
            .select('numero_livraison, date_livraison, statut, commande:commandes(numero_commande)');

          headers = ['Numéro', 'Date', 'Commande', 'Statut'];
          data = deliveries?.map((d: any) => [
            d.numero_livraison,
            new Date(d.date_livraison).toLocaleDateString('fr-FR'),
            d.commande?.numero_commande || 'N/A',
            d.statut,
          ]) || [];
          break;

        case 'lots':
          const { data: lots } = await supabase
            .from('lots_produits')
            .select('numero_lot, quantite_initiale, quantite_restante, prix_achat_unitaire, statut, produit:produits(nom, prix_unitaire)');

          headers = ['Numéro', 'Produit', 'Qté Init', 'Qté Rest', 'Prix Achat', 'Marge %', 'Statut'];
          data = lots?.map((l: any) => [
            l.numero_lot,
            l.produit?.nom || 'N/A',
            l.quantite_initiale.toString(),
            l.quantite_restante.toString(),
            `${l.prix_achat_unitaire} USD`,
            l.produit?.prix_unitaire && l.prix_achat_unitaire
              ? ((l.produit.prix_unitaire - l.prix_achat_unitaire) / l.prix_achat_unitaire * 100).toFixed(1) + '%'
              : 'N/A',
            l.statut,
          ]) || [];
          break;
      }

      exportToPDF(`Rapport ${getModuleTitle()}`, headers, data, `rapport_${module}`);
      alert('Export PDF réussi!');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Exporter le rapport - {getModuleTitle()}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Choisissez le format d'export pour le rapport de {getModuleTitle().toLowerCase()}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={24} />
              <span className="text-lg font-medium">Exporter en Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={24} />
              <span className="text-lg font-medium">Exporter en PDF</span>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
