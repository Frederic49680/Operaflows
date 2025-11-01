"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface AbsenceFormProps {
  collaborateurId: string;
  absence?: {
    id: string;
    type: string;
    motif?: string | null;
    date_debut: string;
    date_fin: string;
    heures_absences?: number | null;
    statut: string;
    impact_planif: boolean;
    synchro_outlook: boolean;
    commentaire?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AbsenceForm({
  collaborateurId,
  absence,
  onClose,
  onSuccess,
}: AbsenceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: absence?.type || "conges_payes",
    motif: absence?.motif || "",
    date_debut: absence?.date_debut
      ? new Date(absence.date_debut).toISOString().split("T")[0]
      : "",
    date_fin: absence?.date_fin
      ? new Date(absence.date_fin).toISOString().split("T")[0]
      : "",
    heures_absences: absence?.heures_absences || null,
    statut: absence?.statut || "en_attente_validation_n1",
    impact_planif: absence?.impact_planif ?? true,
    synchro_outlook: absence?.synchro_outlook ?? false,
    commentaire: absence?.commentaire || "",
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
        motif: formData.motif || null,
        heures_absences: formData.heures_absences || null,
        commentaire: formData.commentaire || null,
      };

      if (absence) {
        const { error: updateError } = await supabase
          .from("absences")
          .update(data)
          .eq("id", absence.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("absences")
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

  const typeLabels: Record<string, string> = {
    conges_payes: "Congés payés",
    rtt: "RTT",
    repos_site: "Repos site",
    maladie: "Maladie",
    accident_travail: "Accident du travail",
    absence_autorisee: "Absence autorisée",
    formation: "Formation",
    habilitation: "Habilitation",
    deplacement_externe: "Déplacement externe",
    autre: "Autre",
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
            Type *
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif
          </label>
          <input
            type="text"
            value={formData.motif}
            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Raison de l'absence"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date début *
          </label>
          <input
            type="date"
            required
            value={formData.date_debut}
            onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date fin *
          </label>
          <input
            type="date"
            required
            value={formData.date_fin}
            onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heures d'absence
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.heures_absences || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                heures_absences: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut *
          </label>
          <select
            required
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            <option value="en_attente_validation_n1">En attente validation N+1</option>
            <option value="validee_n1">Validée N+1</option>
            <option value="refusee_n1">Refusée N+1</option>
            <option value="en_attente_validation_rh">En attente validation RH</option>
            <option value="validee_rh">Validée RH</option>
            <option value="refusee_rh">Refusée RH</option>
            <option value="appliquee">Appliquée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.impact_planif}
            onChange={(e) => setFormData({ ...formData, impact_planif: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Impact sur la planification</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.synchro_outlook}
            onChange={(e) => setFormData({ ...formData, synchro_outlook: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Synchroniser avec Outlook</span>
        </label>
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
          {loading ? "Sauvegarde..." : absence ? "Modifier" : "Créer"}
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

