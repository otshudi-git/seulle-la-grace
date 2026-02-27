import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Fournisseur, Profile } from '../types';
import { Plus, Edit, Trash2, Search, Truck, Phone, Mail } from 'lucide-react';

interface SuppliersModuleProps {
  profile: Profile;
}

export default function SuppliersModule({ profile }: SuppliersModuleProps) {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    telephone: '',
    email: '',
    adresse: '',
  });

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom');

      if (error) throw error;
      setFournisseurs(data || []);
    } catch (error) {
      console.error('Error loading fournisseurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFournisseur) {
        const { error } = await supabase
          .from('fournisseurs')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingFournisseur.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('fournisseurs').insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingFournisseur(null);
      resetForm();
      loadFournisseurs();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur?')) return;

    try {
      const { error } = await supabase.from('fournisseurs').delete().eq('id', id);
      if (error) throw error;
      loadFournisseurs();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      contact: '',
      telephone: '',
      email: '',
      adresse: '',
    });
  };

  const startEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      contact: fournisseur.contact,
      telephone: fournisseur.telephone,
      email: fournisseur.email || '',
      adresse: fournisseur.adresse || '',
    });
    setShowForm(true);
  };

  const filteredFournisseurs = fournisseurs.filter(
    (f) =>
      f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.telephone.includes(searchTerm)
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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Fournisseurs</h1>
          <p className="text-gray-600 mt-1">{fournisseurs.length} fournisseurs enregistrés</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingFournisseur(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-2 text-gray-400">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
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
                {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du fournisseur *
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
                    Personne de contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingFournisseur ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFournisseur(null);
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
        {filteredFournisseurs.map((fournisseur) => (
          <div
            key={fournisseur.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{fournisseur.nom}</h3>
                  <p className="text-sm text-gray-600">{fournisseur.contact}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => startEdit(fournisseur)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(fournisseur.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone size={14} />
                <span>{fournisseur.telephone}</span>
              </div>

              {fournisseur.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <span>{fournisseur.email}</span>
                </div>
              )}

              {fournisseur.adresse && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {fournisseur.adresse}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFournisseurs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Truck size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun fournisseur trouvé</p>
        </div>
      )}
    </div>
  );
}
