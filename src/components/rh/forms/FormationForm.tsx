"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface FormationFormProps {
  collaborateurId: string;
  formation?: {
    id: string;
    libelle: string;
    type: string;
    date_debut: string;
    date_fin?: string | null;
    duree_heures?: number | null;
    organisme?: string | null;
    lieu?: string | null;
    formateur?: string | null;
    statut: string;
    resultat?: string | null;
    certificat_url?: string | null;
    commentaire?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormationForm({
  collaborateurId,
  formation,
  onClose,
  onSuccess,
}: FormationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    libelle: formation?.libelle || "",
    type: formation?.type || "obligatoire",
    date_debut: formation?.date_debut
      ? new Date(formation.date_debut).toISOString().split("T")[0]
      : "",
    date_fin: formation?.date_fin
      ? new Date(formation.date_fin).toISOString().split("T")[0]
      : "",
    duree_heures: formation?.duree_heures || null,
    organisme: formation?.organisme || "",
    lieu: formation?.lieu || "",
    formateur: formation?.formateur || "",
    statut: formation?.statut || "planifiee",
    resultat: formation?.resultat || "",
    certificat_url: formation?.certificat_url || "",
    commentaire: formation?.commentaire || "",
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
        date_fin: formData.date_fin || null,
        duree_heures: formData.duree_heures || null,
        organisme: formData.organisme || null,
        lieu: formData.lieu || null,
        formateur: formData.formateur || null,
        resultat: formData.resultat || null,
        certificat_url: formData.certificat_url || null,
        commentaire: formData.commentaire || null,
      };

      if (formation) {
        const { error: updateError } = await supabase
          .from("formations")
          .update(data)
          .eq("id", formation.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("formations")
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
            Libellé *
          </label>
          <input
            type="text"
            required
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
            placeholder="Ex: Formation sécurité électrique"
          />
        </div>

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
            <option value="obligatoire">Obligatoire</option>
            <option value="reglementaire">Réglementaire</option>
            <option value="metier">Métier</option>
            <option value="sante_securite">Santé & Sécurité</option>
            <option value="evolution">Évolution</option>
            <option value="autre">Autre</option>
          </select>
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
            Date fin
          </label>
          <input
            type="date"
            value={formData.date_fin}
            onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée (heures)
          </label>
          <input
            type="number"
            min="0"
            value={formData.duree_heures || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                duree_heures: e.target.value ? parseInt(e.target.value) : null,
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
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
            <option value="reportee">Reportée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organisme
          </label>
          <input
            type="text"
            value={formData.organisme}
            onChange={(e) => setFormData({ ...formData, organisme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Ex: AFPA, INRS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lieu
          </label>
          <input
            type="text"
            value={formData.lieu}
            onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formateur
          </label>
          <input
            type="text"
            value={formData.formateur}
            onChange={(e) => setFormData({ ...formData, formateur: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
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
          Résultat
        </label>
        <select
          value={formData.resultat || ""}
          onChange={(e) => setFormData({ ...formData, resultat: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
        >
          <option value="">Non renseigné</option>
          <option value="reussi">Réussi</option>
          <option value="echec">Échec</option>
          <option value="en_attente">En attente</option>
        </select>
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
          {loading ? "Sauvegarde..." : formation ? "Modifier" : "Créer"}
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

