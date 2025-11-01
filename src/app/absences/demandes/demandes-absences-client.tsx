"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AbsenceForm from "@/components/rh/forms/AbsenceForm";
import type { Absence, CatalogueAbsence } from "@/types/rh";

interface DemandesAbsencesClientProps {
  initialAbsences: any[];
  catalogue: CatalogueAbsence[];
  collaborateurId: string | null;
  canValidate?: boolean;
  hasRHAccess?: boolean;
  collaborateursDisponibles?: Array<{ id: string; nom: string; prenom: string; email: string; user_id: string | null }>;
}

export default function DemandesAbsencesClient({
  initialAbsences,
  catalogue,
  collaborateurId,
  canValidate = false,
  hasRHAccess = false,
  collaborateursDisponibles = [],
}: DemandesAbsencesClientProps) {
  const [absences] = useState(initialAbsences);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [selectedCollaborateurId, setSelectedCollaborateurId] = useState<string | null>(
    collaborateurId || (hasRHAccess && collaborateursDisponibles.length > 0 ? collaborateursDisponibles[0].id : null)
  );

  const handleOpenModal = (absence?: Absence) => {
    if (absence) {
      setSelectedAbsence(absence);
    } else {
      setSelectedAbsence(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAbsence(null);
    // Rafraîchir les données
    window.location.reload();
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      en_attente_validation_n1: {
        label: "En attente N+1",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      },
      validee_n1: {
        label: "Validée N+1",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      refusee_n1: {
        label: "Refusée N+1",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      en_attente_validation_rh: {
        label: "En attente RH",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      validee_rh: {
        label: "Validée RH",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      appliquee: {
        label: "Appliquée",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      refusee_rh: {
        label: "Refusée RH",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      annulee: {
        label: "Annulée",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };

    return badges[statut] || {
      label: statut,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  if (!collaborateurId && collaborateursDisponibles.length === 0 && !hasRHAccess) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-700 p-4 rounded-r-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>
            Vous devez être associé à un profil collaborateur pour créer une demande d&apos;absence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {(hasRHAccess || (canValidate && collaborateursDisponibles.length > 0)) && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Créer pour :
            </label>
            <select
              value={selectedCollaborateurId || ""}
              onChange={(e) => setSelectedCollaborateurId(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm min-w-[300px]"
              required
            >
              <option value="">-- Sélectionner un collaborateur --</option>
              {collaborateurId && (
                <option value={collaborateurId}>
                  Moi-même - {collaborateurId ? "Mon compte" : "Pas de compte"}
                </option>
              )}
              {collaborateursDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom} {c.user_id ? "(avec compte)" : "(sans compte)"}
                  {hasRHAccess && " - Validation auto"}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
          disabled={!selectedCollaborateurId}
        >
          <Plus className="h-4 w-4" />
          Nouvelle demande
          {hasRHAccess && selectedCollaborateurId && selectedCollaborateurId !== collaborateurId && (
            <span className="text-xs opacity-75 ml-1">(auto-validée)</span>
          )}
        </button>
      </div>

      {absences.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune demande d&apos;absence
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre première demande d&apos;absence
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer une demande
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {absences.map((abs) => {
            const badge = getStatutBadge(abs.statut);
            const catalogueAbsence = abs.catalogue_absence || 
              catalogue.find((c) => c.code === abs.type?.toUpperCase());

            return (
              <div
                key={abs.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {catalogueAbsence?.libelle || abs.type || "Absence"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(abs.date_debut), "dd/MM/yyyy", { locale: fr })} -{" "}
                        {format(new Date(abs.date_fin), "dd/MM/yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <dl className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-blue-50 rounded-md">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Durée
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {abs.duree_jours
                          ? `${abs.duree_jours.toFixed(1)} jour${abs.duree_jours > 1 ? "s" : ""}`
                          : abs.jours_ouvres
                          ? `${abs.jours_ouvres.toFixed(1)} jour${abs.jours_ouvres > 1 ? "s" : ""} ouvré${abs.jours_ouvres > 1 ? "s" : ""}`
                          : "-"}
                      </dd>
                    </div>
                  </div>

                  {abs.motif && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-purple-50 rounded-md">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Motif
                        </dt>
                        <dd className="text-sm text-gray-900 line-clamp-2">
                          {abs.motif}
                        </dd>
                      </div>
                    </div>
                  )}

                  {/* Historique des validations */}
                  {(abs.statut === "validee_n1" ||
                    abs.statut === "refusee_n1" ||
                    abs.statut === "en_attente_validation_rh" ||
                    abs.statut === "validee_rh" ||
                    abs.statut === "refusee_rh") && (
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                      <div className="mt-0.5 p-1.5 bg-cyan-50 rounded-md">
                        <CheckCircle className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Validation
                        </dt>
                        <dd className="text-xs text-gray-600">
                          {abs.statut === "validee_n1" && abs.date_validation_n1 && (
                            <>Validée N+1 le {format(new Date(abs.date_validation_n1), "dd/MM/yyyy à HH:mm", { locale: fr })}</>
                          )}
                          {abs.statut === "refusee_n1" && abs.date_validation_n1 && (
                            <>Refusée N+1 le {format(new Date(abs.date_validation_n1), "dd/MM/yyyy à HH:mm", { locale: fr })}</>
                          )}
                          {abs.statut === "en_attente_validation_rh" && (
                            <>En attente de validation RH</>
                          )}
                          {abs.statut === "validee_rh" && abs.date_validation_rh && (
                            <>Validée RH le {format(new Date(abs.date_validation_rh), "dd/MM/yyyy à HH:mm", { locale: fr })}</>
                          )}
                          {abs.statut === "refusee_rh" && abs.date_validation_rh && (
                            <>Refusée RH le {format(new Date(abs.date_validation_rh), "dd/MM/yyyy à HH:mm", { locale: fr })}</>
                          )}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>

                {/* Actions */}
                {abs.statut === "en_attente_validation_n1" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenModal(abs)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Modifier la demande
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulaire */}
      {modalOpen && selectedCollaborateurId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAbsence ? "Modifier l'absence" : "Nouvelle demande d'absence"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <AbsenceForm
                collaborateurId={selectedCollaborateurId}
                catalogue={catalogue}
                absence={selectedAbsence}
                onClose={handleCloseModal}
                onSuccess={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

