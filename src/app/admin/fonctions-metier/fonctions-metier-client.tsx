"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Save, X, CheckCircle, AlertTriangle } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";

interface FonctionMetier {
  id: string;
  libelle: string;
  description: string | null;
  is_active: boolean;
  ordre_affichage: number;
  created_at: string;
  updated_at: string;
}

interface FonctionsMetierClientProps {
  fonctions: FonctionMetier[];
}

export default function FonctionsMetierClient({
  fonctions: initialFonctions,
}: FonctionsMetierClientProps) {
  const router = useRouter();
  const [fonctions, setFonctions] = useState(initialFonctions);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFonction, setSelectedFonction] = useState<FonctionMetier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    libelle: string;
    description: string;
    ordre_affichage: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    libelle: "",
    description: "",
    ordre_affichage: (fonctions.filter(f => f.is_active).length || 0) + 1,
  });

  const handleCreate = async () => {
    if (!formData.libelle.trim()) {
      setError("Le libellé est requis");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClientSupabase();
      const { data, error: insertError } = await supabase
        .from("tbl_fonctions_metier")
        .insert({
          libelle: formData.libelle.trim(),
          description: formData.description.trim() || null,
          ordre_affichage: formData.ordre_affichage || 0,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess("Fonction métier créée avec succès");
      setModalOpen(false);
      setFormData({
        libelle: "",
        description: "",
        ordre_affichage: (fonctions.filter(f => f.is_active).length || 0) + 1,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editValues || !editValues.libelle.trim()) {
      setError("Le libellé est requis");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClientSupabase();
      const { error: updateError } = await supabase
        .from("tbl_fonctions_metier")
        .update({
          libelle: editValues.libelle.trim(),
          description: editValues.description.trim() || null,
          ordre_affichage: editValues.ordre_affichage || 0,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setSuccess("Fonction métier modifiée avec succès");
      setEditingId(null);
      setEditValues(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${currentStatus ? "désactiver" : "activer"} cette fonction métier ?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClientSupabase();
      const { error: updateError } = await supabase
        .from("tbl_fonctions_metier")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      setSuccess(`Fonction métier ${!currentStatus ? "activée" : "désactivée"} avec succès`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cette fonction métier ? Cette action est irréversible.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClientSupabase();
      const { error: deleteError } = await supabase
        .from("tbl_fonctions_metier")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setSuccess("Fonction métier supprimée avec succès");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  const startEdit = (fonction: FonctionMetier) => {
    setEditingId(fonction.id);
    setEditValues({
      libelle: fonction.libelle,
      description: fonction.description || "",
      ordre_affichage: fonction.ordre_affichage,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  return (
    <>
      {/* Messages de succès/erreur */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Bouton Ajouter */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedFonction(null);
            setModalOpen(true);
            setFormData({
              libelle: "",
              description: "",
              ordre_affichage: (fonctions.filter(f => f.is_active).length || 0) + 1,
            });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Ajouter une fonction métier
        </button>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Libellé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fonctions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune fonction métier enregistrée
                  </td>
                </tr>
              ) : (
                fonctions.map((fonction) => (
                  <tr key={fonction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === fonction.id && editValues ? (
                        <input
                          type="number"
                          value={editValues.ordre_affichage}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              ordre_affichage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      ) : (
                        fonction.ordre_affichage
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingId === fonction.id && editValues ? (
                        <input
                          type="text"
                          value={editValues.libelle}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              libelle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          required
                        />
                      ) : (
                        fonction.libelle
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {editingId === fonction.id && editValues ? (
                        <textarea
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          rows={2}
                        />
                      ) : (
                        fonction.description || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          fonction.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {fonction.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === fonction.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(fonction.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Enregistrer"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            title="Annuler"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(fonction)}
                            className="text-primary hover:text-primary-dark"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(fonction.id, fonction.is_active)}
                            className={`${
                              fonction.is_active
                                ? "text-amber-600 hover:text-amber-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={fonction.is_active ? "Désactiver" : "Activer"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-600/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedFonction ? "Modifier la fonction métier" : "Nouvelle fonction métier"}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedFonction(null);
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  value={formData.libelle}
                  onChange={(e) =>
                    setFormData({ ...formData, libelle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Conducteur de travaux"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Description optionnelle de la fonction métier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.ordre_affichage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ordre_affichage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Création..." : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedFonction(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

