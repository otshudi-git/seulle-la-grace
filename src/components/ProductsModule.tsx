import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Produit, Categorie, Profile, Fournisseur } from '../types';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle } from 'lucide-react';

interface ProductsModuleProps {
  profile: Profile;
}

export default function ProductsModule({ profile }: ProductsModuleProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    reference: '',
    categorie_id: '',
    fournisseur_id: '',
    description: '',
    unite_mesure: 'kg',
    prix_unitaire: 0,
    stock_actuel: 0,
    stock_minimum: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [produitsRes, categoriesRes, fournisseursRes] = await Promise.all([
        supabase.from('produits').select('*, categorie:categories(*), fournisseur:fournisseurs(*)').order('nom'),
        supabase.from('categories').select('*').order('nom'),
        supabase.from('fournisseurs').select('*').eq('actif', true).order('nom'),
      ]);

      if (produitsRes.data) setProduits(produitsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (fournisseursRes.data) setFournisseurs(fournisseursRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('produits')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('produits').insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;

    try {
      const { error } = await supabase.from('produits').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      reference: '',
      categorie_id: '',
      fournisseur_id: '',
      description: '',
      unite_mesure: 'kg',
      prix_unitaire: 0,
      stock_actuel: 0,
      stock_minimum: 0,
    });
  };

  const startEdit = (product: Produit) => {
    setEditingProduct(product);
    setFormData({
      nom: product.nom,
      reference: product.reference,
      categorie_id: product.categorie_id || '',
      fournisseur_id: product.fournisseur_id || '',
      description: product.description || '',
      unite_mesure: product.unite_mesure,
      prix_unitaire: product.prix_unitaire,
      stock_actuel: product.stock_actuel,
      stock_minimum: product.stock_minimum,
    });
    setShowForm(true);
  };

  const filteredProduits = produits.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">{produits.length} produits au catalogue</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau produit</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-2 text-gray-400">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
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
                    {fournisseurs.map((four) => (
                      <option key={four.id} value={four.id}>
                        {four.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité de mesure
                  </label>
                  <select
                    value={formData.unite_mesure}
                    onChange={(e) => setFormData({ ...formData, unite_mesure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="L">Litre (L)</option>
                    <option value="unité">Unité</option>
                    <option value="carton">Carton</option>
                    <option value="sac">Sac</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix unitaire (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) =>
                      setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock actuel
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock_actuel}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_actuel: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock minimum
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock_minimum}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_minimum: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingProduct ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProduits.map((product) => {
          const isLowStock = product.stock_actuel <= product.stock_minimum;

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{product.nom}</h3>
                    <p className="text-xs text-gray-500">{product.reference}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {product.categorie && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {product.categorie.nom}
                    </span>
                  )}
                  {product.fournisseur && (
                    <span className="px-2 py-1 bg-blue-50 rounded text-blue-700">
                      {product.fournisseur.nom}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stock actuel</span>
                  <span
                    className={`font-bold ${
                      isLowStock ? 'text-red-600' : 'text-gray-800'
                    }`}
                  >
                    {product.stock_actuel} {product.unite_mesure}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stock minimum</span>
                  <span className="text-gray-800">{product.stock_minimum} {product.unite_mesure}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Prix unitaire</span>
                  <span className="text-gray-800 font-medium">
                    {product.prix_unitaire.toLocaleString()} USD
                  </span>
                </div>

                {isLowStock && (
                  <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    <AlertTriangle size={14} />
                    <span className="font-medium">Stock faible</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProduits.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}
