"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface VisiteMedicaleFormProps {
  collaborateurId: string;
  visite?: {
    id: string;
    type_visite: string;
    date_visite: string;
    date_prochaine_visite?: string | null;
    frequence_mois: number;
    centre_medical?: string | null;
    medecin?: string | null;
    statut: string;
    avis_medical?: string | null;
    restrictions?: string | null;
    certificat_url?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VisiteMedicaleForm({
  collaborateurId,
  visite,
  onClose,
  onSuccess,
}: VisiteMedicaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type_visite: visite?.type_visite || "aptitude",
    date_visite: visite?.date_visite
      ? new Date(visite.date_visite).toISOString().split("T")[0]
      : "",
    date_prochaine_visite: visite?.date_prochaine_visite
      ? new Date(visite.date_prochaine_visite).toISOString().split("T")[0]
      : "",
    frequence_mois: visite?.frequence_mois || 24,
    centre_medical: visite?.centre_medical || "",
    medecin: visite?.medecin || "",
    statut: visite?.statut || "en_attente",
    avis_medical: visite?.avis_medical || "",
    restrictions: visite?.restrictions || "",
    certificat_url: visite?.certificat_url || "",
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
        frequence_mois: parseInt(formData.frequence_mois.toString()) || 24,
        date_prochaine_visite: formData.date_prochaine_visite || null,
        centre_medical: formData.centre_medical || null,
        medecin: formData.medecin || null,
        avis_medical: formData.avis_medical || null,
        restrictions: formData.restrictions || null,
        certificat_url: formData.certificat_url || null,
      };

      if (visite) {
        const { error: updateError } = await supabase
          .from("visites_medicales")
          .update(data)
          .eq("id", visite.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("visites_medicales")
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
            Type de visite *
          </label>
          <select
            required
            value={formData.type_visite}
            onChange={(e) => setFormData({ ...formData, type_visite: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            <option value="aptitude">Aptitude</option>
            <option value="reprise">Reprise de travail</option>
            <option value="periodique">Périodique</option>
            <option value="pre_embauche">Pré-embauche</option>
            <option value="sortie">Sortie</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date visite *
          </label>
          <input
            type="date"
            required
            value={formData.date_visite}
            onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date prochaine visite
          </label>
          <input
            type="date"
            value={formData.date_prochaine_visite}
            onChange={(e) => setFormData({ ...formData, date_prochaine_visite: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fréquence (mois) *
          </label>
          <input
            type="number"
            min="1"
            required
            value={formData.frequence_mois}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequence_mois: parseInt(e.target.value) || 24,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Centre médical
          </label>
          <input
            type="text"
            value={formData.centre_medical}
            onChange={(e) => setFormData({ ...formData, centre_medical: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Ex: Centre médical du travail"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Médecin
          </label>
          <input
            type="text"
            value={formData.medecin}
            onChange={(e) => setFormData({ ...formData, medecin: e.target.value })}
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
            <option value="en_attente">En attente</option>
            <option value="apte">Apte</option>
            <option value="inapte">Inapte</option>
            <option value="apte_avec_restrictions">Apte avec restrictions</option>
            <option value="reportee">Reportée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Certificat
          </label>
          <input
            type="url"
            value={formData.certificat_url}
            onChange={(e) => setFormData({ ...formData, certificat_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Avis médical
        </label>
        <textarea
          value={formData.avis_medical}
          onChange={(e) => setFormData({ ...formData, avis_medical: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Restrictions
        </label>
        <textarea
          value={formData.restrictions}
          onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Ex: Pas de travail en hauteur, pas de port de charges..."
        />
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sauvegarde..." : visite ? "Modifier" : "Créer"}
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

