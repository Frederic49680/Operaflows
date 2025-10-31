"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, X } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";

interface CreateCollaborateurClientProps {
  responsables: Array<{ id: string; nom: string; prenom: string }>;
  availableUsers: Array<{ id: string; email: string }>;
  sites: Array<{ site_id: string; site_code: string; site_label: string }>;
}

export default function CreateCollaborateurClient({
  responsables,
  availableUsers,
  sites,
}: CreateCollaborateurClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction_metier: "",
    site: "", // Deprecated: gardé pour compatibilité
    site_id: "", // Nouveau: FK vers tbl_sites
    type_contrat: "CDI",
    responsable_id: "", // Deprecated: gardé pour compatibilité
    responsable_activite_id: "", // Nouveau: FK vers collaborateurs
    user_id: "",
    date_entree: "",
    date_sortie: "",
    statut: "actif",
    commentaire: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClientSupabase();

      // Préparer les données
      const collaborateurData: Record<string, unknown> = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim() || null,
        fonction_metier: formData.fonction_metier.trim() || null,
        site: formData.site.trim() || null, // Deprecated: gardé pour compatibilité
        site_id: formData.site_id || null, // Nouveau: FK vers tbl_sites
        type_contrat: formData.type_contrat,
        responsable_id: formData.responsable_id || null, // Deprecated: gardé pour compatibilité
        responsable_activite_id: formData.responsable_activite_id || null, // Nouveau
        user_id: formData.user_id || null,
        date_entree: formData.date_entree || null,
        date_sortie: formData.date_sortie || null,
        statut: formData.statut,
        commentaire: formData.commentaire.trim() || null,
      };

      const { data, error: insertError } = await supabase
        .from("collaborateurs")
        .insert(collaborateurData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || "Erreur lors de la création");
      }

      // Si un user_id a été sélectionné, mettre à jour tbl_users pour lier le collaborateur
      if (formData.user_id && data) {
        await supabase
          .from("tbl_users")
          .update({ collaborateur_id: data.id })
          .eq("id", formData.user_id);
      }

      router.push(`/rh/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/rh"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Retour à la liste
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold text-primary mb-6">Nouveau collaborateur</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h2 className="text-xl font-semibold text-secondary mb-4">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div>
              <h2 className="text-xl font-semibold text-secondary mb-4">
                Informations professionnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Fonction métier
                  </label>
                  <input
                    type="text"
                    value={formData.fonction_metier}
                    onChange={(e) =>
                      setFormData({ ...formData, fonction_metier: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Site
                  </label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Type de contrat *
                  </label>
                  <select
                    required
                    value={formData.type_contrat}
                    onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Interim">Intérim</option>
                    <option value="Apprenti">Apprenti</option>
                    <option value="Stagiaire">Stagiaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Responsable d'activité
                  </label>
                  <select
                    value={formData.responsable_activite_id}
                    onChange={(e) => setFormData({ ...formData, responsable_activite_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    <option value="">Auto (selon le site)</option>
                    {responsables.map((resp) => (
                      <option key={resp.id} value={resp.id}>
                        {resp.prenom} {resp.nom}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Laissé vide, le responsable sera déterminé automatiquement selon le site
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Compte utilisateur associé
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    <option value="">Aucun</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Statut *
                  </label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-xl font-semibold text-secondary mb-4">Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Date d'entrée
                  </label>
                  <input
                    type="date"
                    value={formData.date_entree}
                    onChange={(e) => setFormData({ ...formData, date_entree: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Date de sortie
                  </label>
                  <input
                    type="date"
                    value={formData.date_sortie}
                    onChange={(e) => setFormData({ ...formData, date_sortie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Commentaire
              </label>
              <textarea
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {loading ? "Création..." : "Créer le collaborateur"}
              </button>
              <Link
                href="/rh"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-5 w-5" />
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

