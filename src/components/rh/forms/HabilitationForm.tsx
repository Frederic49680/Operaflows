"use client";

import { useState, useEffect } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface HabilitationFormProps {
  collaborateurId: string;
  habilitation?: {
    id: string;
    type: string;
    libelle: string;
    date_obtention: string;
    date_expiration?: string | null;
    duree_validite_mois?: number | null;
    organisme?: string | null;
    numero_certificat?: string | null;
    statut: string;
    commentaire?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HabilitationForm({
  collaborateurId,
  habilitation,
  onClose,
  onSuccess,
}: HabilitationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: habilitation?.type || "electrique",
    libelle: habilitation?.libelle || "",
    date_obtention: habilitation?.date_obtention
      ? new Date(habilitation.date_obtention).toISOString().split("T")[0]
      : "",
    date_expiration: habilitation?.date_expiration
      ? new Date(habilitation.date_expiration).toISOString().split("T")[0]
      : "",
    duree_validite_mois: habilitation?.duree_validite_mois || null,
    organisme: habilitation?.organisme || "",
    numero_certificat: habilitation?.numero_certificat || "",
    statut: habilitation?.statut || "valide",
    commentaire: habilitation?.commentaire || "",
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
        duree_validite_mois: formData.duree_validite_mois || null,
        organisme: formData.organisme || null,
        numero_certificat: formData.numero_certificat || null,
        commentaire: formData.commentaire || null,
      };

      if (habilitation) {
        const { error: updateError } = await supabase
          .from("habilitations")
          .update(data)
          .eq("id", habilitation.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("habilitations")
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
            Type *
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          >
            <option value="electrique">Électrique</option>
            <option value="travail_hauteur">Travail en hauteur</option>
            <option value="atex">ATEX</option>
            <option value="grue">Grue / Engin</option>
            <option value="soudure">Soudure</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Libellé *
          </label>
          <input
            type="text"
            required
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Ex: Habilitation électrique BT"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'obtention *
          </label>
          <input
            type="date"
            required
            value={formData.date_obtention}
            onChange={(e) => setFormData({ ...formData, date_obtention: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'expiration
          </label>
          <input
            type="date"
            value={formData.date_expiration}
            onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée validité (mois)
          </label>
          <input
            type="number"
            min="1"
            value={formData.duree_validite_mois || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                duree_validite_mois: e.target.value ? parseInt(e.target.value) : null,
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
            <option value="valide">Valide</option>
            <option value="expire">Expiré</option>
            <option value="en_cours_renouvellement">En cours de renouvellement</option>
            <option value="suspendu">Suspendu</option>
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
            placeholder="Ex: INRS, AFPA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            N° Certificat
          </label>
          <input
            type="text"
            value={formData.numero_certificat}
            onChange={(e) => setFormData({ ...formData, numero_certificat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
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
          {loading ? "Sauvegarde..." : habilitation ? "Modifier" : "Créer"}
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

