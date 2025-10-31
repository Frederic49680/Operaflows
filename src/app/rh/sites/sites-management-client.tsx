"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Users, AlertTriangle } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import Modal from "@/components/rh/Modal";
import type { SiteAvecResponsables } from "@/types/sites";

interface SitesManagementClientProps {
  sites: SiteAvecResponsables[];
}

export default function SitesManagementClient({
  sites: initialSites,
}: SitesManagementClientProps) {
  const [sites] = useState(initialSites);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteAvecResponsables | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (siteData: { site_code: string; site_label: string; parent_site_id?: string; is_active: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClientSupabase();

      if (selectedSite) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from("tbl_sites")
          .update(siteData)
          .eq("site_id", selectedSite.site_id);

        if (updateError) throw updateError;
      } else {
        // Création
        const { error: insertError } = await supabase
          .from("tbl_sites")
          .insert(siteData);

        if (insertError) throw insertError;
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver ce site ?")) return;

    try {
      const supabase = createClientSupabase();
      const { error } = await supabase
        .from("tbl_sites")
        .update({ is_active: false })
        .eq("site_id", siteId);

      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la désactivation");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Référentiel Sites
              </h1>
              <p className="text-lg text-secondary">
                Gestion des sites d'activité et de leurs responsables
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedSite(null);
                setModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Ajouter un site
            </button>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Libellé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Site parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Responsables
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
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun site enregistré
                    </td>
                  </tr>
                ) : (
                  sites.map((site) => (
                    <tr key={site.site_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {site.site_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {site.site_label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.parent_site_id 
                          ? sites.find(s => s.site_id === site.parent_site_id)?.site_label || "-"
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {site.responsables_actifs.length === 0 ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Aucun responsable
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {site.responsables_actifs.map((resp, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>
                                  {resp.collaborateur?.prenom} {resp.collaborateur?.nom}
                                  {resp.role_fonctionnel !== "Responsable d'activité" && (
                                    <span className="text-gray-500 ml-1">
                                      ({resp.role_fonctionnel})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            site.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {site.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSite(site);
                              setModalOpen(true);
                            }}
                            className="text-primary hover:text-primary-dark"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(site.site_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Désactiver"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal création/édition site */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSite(null);
          setError(null);
        }}
        title={selectedSite ? "Modifier le site" : "Nouveau site"}
        size="md"
      >
        <SiteForm
          site={selectedSite}
          allSites={sites}
          onSave={handleSave}
          onCancel={() => {
            setModalOpen(false);
            setSelectedSite(null);
          }}
          loading={loading}
          error={error}
        />
      </Modal>
    </div>
  );
}

// Formulaire site
function SiteForm({
  site,
  allSites,
  onSave,
  onCancel,
  loading,
  error,
}: {
  site: SiteAvecResponsables | null;
  allSites: SiteAvecResponsables[];
  onSave: (data: { site_code: string; site_label: string; parent_site_id?: string; is_active: boolean }) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    site_code: site?.site_code || "",
    site_label: site?.site_label || "",
    parent_site_id: site?.parent_site_id || "",
    is_active: site?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      parent_site_id: formData.parent_site_id || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code site *
        </label>
        <input
          type="text"
          required
          value={formData.site_code}
          onChange={(e) => setFormData({ ...formData, site_code: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          placeholder="Ex: BEL, DAM, SAV"
          maxLength={10}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Libellé *
        </label>
        <input
          type="text"
          required
          value={formData.site_label}
          onChange={(e) => setFormData({ ...formData, site_label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          placeholder="Ex: Bellegarde, Damparis, Savoie"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site parent (optionnel)
        </label>
        <select
          value={formData.parent_site_id}
          onChange={(e) => setFormData({ ...formData, parent_site_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
        >
          <option value="">Aucun</option>
          {allSites
            .filter((s) => !site || s.site_id !== site.site_id)
            .map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.site_code} - {s.site_label}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Site actif</span>
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sauvegarde..." : site ? "Modifier" : "Créer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

