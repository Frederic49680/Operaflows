"use client";

import { useState } from "react";
import type { CatalogueAbsence } from "@/types/rh";

interface AbsenceFormProps {
  collaborateurId: string;
  catalogue?: CatalogueAbsence[];
  absence?: {
    id: string;
    catalogue_absence_id?: string | null;
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
  canEditStatut?: boolean; // Pour permettre aux admins de modifier le statut
}

export default function AbsenceForm({
  collaborateurId,
  catalogue = [],
  absence,
  onClose,
  onSuccess,
  canEditStatut = false,
}: AbsenceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    catalogue_absence_id: absence?.catalogue_absence_id || catalogue.find(c => c.code === "CP")?.id || "",
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

  // Vérifier si le type sélectionné est "Autre"
  const selectedCatalogue = defaultCatalogue.find(cat => cat.id === formData.catalogue_absence_id);
  const isAutreType = selectedCatalogue?.code === "AUTRE" || selectedCatalogue?.libelle === "Autre";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = {
        collaborateur_id: collaborateurId,
        catalogue_absence_id: formData.catalogue_absence_id || null,
        motif: formData.motif || null,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        heures_absences: formData.heures_absences || null,
        statut: canEditStatut ? formData.statut : undefined, // Ne pas envoyer le statut si l'utilisateur ne peut pas le modifier
        impact_planif: formData.impact_planif,
        synchro_outlook: formData.synchro_outlook,
        commentaire: formData.commentaire || null,
      };

      let response: Response;
      if (absence) {
        // Mise à jour via API route
        response = await fetch(`/api/rh/absences/${absence.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Création via API route (qui gère la validation automatique)
        response = await fetch("/api/rh/absences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Si pas de catalogue, utiliser des valeurs par défaut (fallback)
  const defaultCatalogue: CatalogueAbsence[] = catalogue.length > 0 ? catalogue : [
    {
      id: "",
      code: "CP",
      libelle: "Congés payés",
      categorie: "legale" as const,
      besoin_justificatif: false,
      besoin_validation_n1: true,
      besoin_validation_rh: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "",
      code: "RTT",
      libelle: "RTT",
      categorie: "legale" as const,
      besoin_justificatif: false,
      besoin_validation_n1: true,
      besoin_validation_rh: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

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
            value={formData.catalogue_absence_id || ""}
            onChange={(e) => setFormData({ ...formData, catalogue_absence_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            <option value="">-- Sélectionner un type --</option>
            {defaultCatalogue.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.libelle}
              </option>
            ))}
          </select>
        </div>

        {isAutreType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif *
            </label>
            <input
              type="text"
              required={isAutreType}
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Raison de l'absence"
            />
          </div>
        )}

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


        {canEditStatut && (
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
        )}
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

