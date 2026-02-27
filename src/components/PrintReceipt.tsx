import { X, Printer } from 'lucide-react';

interface ReceiptItem {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

interface PrintReceiptProps {
  type: 'commande' | 'paiement';
  data: {
    numero: string;
    date: string;
    client: {
      nom: string;
      adresse?: string;
      telephone?: string;
    };
    items?: ReceiptItem[];
    montant_total?: number;
    montant_paye?: number;
    mode_paiement?: string;
  };
  onClose: () => void;
}

export default function PrintReceipt({ type, data, onClose }: PrintReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-gray-800">
            {type === 'commande' ? 'Bon de Commande' : 'Reçu de Paiement'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer size={20} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 print:p-12" id="receipt-content">
          <div className="flex flex-col items-center mb-8">
            <img src="/LOGO.jpg" alt="Logo" className="h-24 w-24 rounded-xl object-cover mb-4 shadow-md" />
            <h1 className="text-2xl font-bold text-gray-800">Seule La Grâce</h1>
            <p className="text-sm text-gray-500 mt-1">Système de Gestion de Stock</p>
             <p className="text-xs text-gray-500 mt-1">Contact: +243 815 969 334 </p>
          </div>
         

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              {type === 'commande' ? 'BON DE COMMANDE' : 'REÇU DE PAIEMENT'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Numéro</p>
                <p className="font-bold text-gray-800">{data.numero}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-bold text-gray-800">
                  {new Date(data.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-600 mb-2">CLIENT</h3>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="font-bold text-gray-800">{data.client.nom}</p>
              {data.client.adresse && (
                <p className="text-sm text-gray-600">{data.client.adresse}</p>
              )}
              {data.client.telephone && (
                <p className="text-sm text-gray-600">Tél: {data.client.telephone}</p>
              )}
            </div>
          </div>

          {type === 'commande' && data.items && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-2">DÉTAILS DE LA COMMANDE</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left text-sm">Produit</th>
                    <th className="border border-gray-300 p-2 text-center text-sm">Quantité</th>
                    <th className="border border-gray-300 p-2 text-right text-sm">Prix Unit.</th>
                    <th className="border border-gray-300 p-2 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2 text-sm">{item.nom}</td>
                      <td className="border border-gray-300 p-2 text-center text-sm">
                        {item.quantite}
                      </td>
                      <td className="border border-gray-300 p-2 text-right text-sm">
                        {item.prix_unitaire.toLocaleString()} USD
                      </td>
                      <td className="border border-gray-300 p-2 text-right text-sm font-medium">
                        {item.total.toLocaleString()} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="border border-gray-300 p-2 text-right font-bold">
                      TOTAL
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-bold text-lg">
                      {data.montant_total?.toLocaleString()} USD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {type === 'paiement' && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-2">DÉTAILS DU PAIEMENT</h3>
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant payé</span>
                  <span className="font-bold text-gray-800 text-lg">
                    {data.montant_paye?.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode de paiement</span>
                  <span className="font-medium text-gray-800">{data.mode_paiement}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-8">Signature du client</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-gray-500">Date et signature</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-8">Signature du responsable</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-gray-500">Date et signature</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>Merci pour votre confiance</p>
            <p className="mt-1">
              Document généré le {new Date().toLocaleDateString('fr-FR')} à{' '}
              {new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
