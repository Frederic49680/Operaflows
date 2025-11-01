"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface DosimetrieFormProps {
  collaborateurId: string;
  dosimetrie?: {
    id: string;
    numero_dosimetre: string;
    periode_debut: string;
    periode_fin: string;
    dose_trimestrielle_mSv: number;
    dose_annuelle_mSv: number;
    dose_cumulee_mSv: number;
    limite_reglementaire_mSv: number;
    fournisseur?: string | null;
    laboratoire?: string | null;
    rapport_rtr_url?: string | null;
    import_source?: string | null;
    commentaire?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DosimetrieForm({
  collaborateurId,
  dosimetrie,
  onClose,
  onSuccess,
}: DosimetrieFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numero_dosimetre: dosimetrie?.numero_dosimetre || "",
    periode_debut: dosimetrie?.periode_debut
      ? new Date(dosimetrie.periode_debut).toISOString().split("T")[0]
      : "",
    periode_fin: dosimetrie?.periode_fin
      ? new Date(dosimetrie.periode_fin).toISOString().split("T")[0]
      : "",
    dose_trimestrielle_mSv: dosimetrie?.dose_trimestrielle_mSv || 0,
    dose_annuelle_mSv: dosimetrie?.dose_annuelle_mSv || 0,
    dose_cumulee_mSv: dosimetrie?.dose_cumulee_mSv || 0,
    limite_reglementaire_mSv: dosimetrie?.limite_reglementaire_mSv || 20.0,
    fournisseur: dosimetrie?.fournisseur || "",
    laboratoire: dosimetrie?.laboratoire || "",
    rapport_rtr_url: dosimetrie?.rapport_rtr_url || "",
    import_source: dosimetrie?.import_source || "manuel",
    commentaire: dosimetrie?.commentaire || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClientSupabase();
      const data = {
        ...formData,
        collaborateur_id: collaborateurId,
        dose_trimestrielle_mSv: parseFloat(formData.dose_trimestrielle_mSv.toString()) || 0,
        dose_annuelle_mSv: parseFloat(formData.dose_annuelle_mSv.toString()) || 0,
        dose_cumulee_mSv: parseFloat(formData.dose_cumulee_mSv.toString()) || 0,
        limite_reglementaire_mSv: parseFloat(formData.limite_reglementaire_mSv.toString()) || 20.0,
        fournisseur: formData.fournisseur || null,
        laboratoire: formData.laboratoire || null,
        rapport_rtr_url: formData.rapport_rtr_url || null,
        commentaire: formData.commentaire || null,
      };

      if (dosimetrie) {
        const { error: updateError } = await supabase
          .from("dosimetrie")
          .update(data)
          .eq("id", dosimetrie.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("dosimetrie")
          .insert(data);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            N° Dosimètre *
          </label>
          <input
            type="text"
            required
            value={formData.numero_dosimetre}
            onChange={(e) => setFormData({ ...formData, numero_dosimetre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
            placeholder="Ex: DOS-2024-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Période début *
          </label>
          <input
            type="date"
            required
            value={formData.periode_debut}
            onChange={(e) => setFormData({ ...formData, periode_debut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Période fin *
          </label>
          <input
            type="date"
            required
            value={formData.periode_fin}
            onChange={(e) => setFormData({ ...formData, periode_fin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dose trimestrielle (mSv)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formData.dose_trimestrielle_mSv}
            onChange={(e) =>
              setFormData({
                ...formData,
                dose_trimestrielle_mSv: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dose annuelle (mSv)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formData.dose_annuelle_mSv}
            onChange={(e) =>
              setFormData({
                ...formData,
                dose_annuelle_mSv: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dose cumulée (mSv)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formData.dose_cumulee_mSv}
            onChange={(e) =>
              setFormData({
                ...formData,
                dose_cumulee_mSv: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Limite réglementaire (mSv)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.limite_reglementaire_mSv}
            onChange={(e) =>
              setFormData({
                ...formData,
                limite_reglementaire_mSv: parseFloat(e.target.value) || 20.0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fournisseur
          </label>
          <input
            type="text"
            value={formData.fournisseur}
            onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Ex: Mirion, Landauer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Laboratoire
          </label>
          <input
            type="text"
            value={formData.laboratoire}
            onChange={(e) => setFormData({ ...formData, laboratoire: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Rapport RTR
          </label>
          <input
            type="url"
            value={formData.rapport_rtr_url}
            onChange={(e) => setFormData({ ...formData, rapport_rtr_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source import
          </label>
          <select
            value={formData.import_source}
            onChange={(e) => setFormData({ ...formData, import_source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            <option value="manuel">Manuel</option>
            <option value="csv">CSV</option>
            <option value="api_laboratoire">API Laboratoire</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commentaire
        </label>
        <textarea
          value={formData.commentaire}
          onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sauvegarde..." : dosimetrie ? "Modifier" : "Créer"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

