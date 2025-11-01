"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ValidationAbsencesClientProps {
  absencesN1: any[];
  absencesRH: any[];
  canValidateN1: boolean;
  canValidateRH: boolean;
}

export default function ValidationAbsencesClient({
  absencesN1,
  absencesRH,
  canValidateN1,
  canValidateRH,
}: ValidationAbsencesClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAbsence, setSelectedAbsence] = useState<any | null>(null);
  const [modalDetailOpen, setModalDetailOpen] = useState(false);

  const handleValidate = async (
    id: string,
    niveau: "n1" | "rh",
    action: "validee" | "refusee"
  ) => {
    setLoading(id);
    setError(null);

    try {
      const statut = action === "validee" ? `validee_${niveau}` : `refusee_${niveau}`;
      
      let motifRefus = null;
      if (action === "refusee") {
        motifRefus = prompt(
          "Motif du refus (optionnel) :"
        );
        if (motifRefus === null) {
          // L'utilisateur a annulé
          setLoading(null);
          return;
        }
      }

      const updateData: Record<string, unknown> = {
        statut,
      };

      if (niveau === "n1") {
        updateData.motif_refus_n1 = motifRefus || null;
      } else {
        updateData.motif_refus_rh = motifRefus || null;
      }

      const response = await fetch(`/api/rh/absences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la validation");
      }

      // Rafraîchir la page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(null);
    }
  };

  const handleViewDetail = async (absence: any) => {
    // Récupérer l'historique
    try {
      const response = await fetch(`/api/rh/absences/${absence.id}/historique`);
      if (response.ok) {
        const historique = await response.json();
        setSelectedAbsence({ ...absence, historique });
        setModalDetailOpen(true);
      } else {
        setSelectedAbsence(absence);
        setModalDetailOpen(true);
      }
    } catch {
      setSelectedAbsence(absence);
      setModalDetailOpen(true);
    }
  };

  const AbsenceCard = ({
    absence,
    niveau,
  }: {
    absence: any;
    niveau: "n1" | "rh";
  }) => {
    const catalogueAbsence = absence.catalogue_absence;
    const collab = absence.collaborateur;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">
                {catalogueAbsence?.libelle || absence.type || "Absence"}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  {collab?.prenom} {collab?.nom}
                </span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            En attente {niveau === "n1" ? "N+1" : "RH"}
          </span>
        </div>

        <dl className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-blue-50 rounded-md">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Période
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {format(new Date(absence.date_debut), "dd/MM/yyyy", { locale: fr })} -{" "}
                {format(new Date(absence.date_fin), "dd/MM/yyyy", { locale: fr })}
              </dd>
              <dd className="text-xs text-gray-600 mt-1">
                {absence.duree_jours
                  ? `${absence.duree_jours.toFixed(1)} jour${absence.duree_jours > 1 ? "s" : ""}`
                  : absence.jours_ouvres
                  ? `${absence.jours_ouvres.toFixed(1)} jour${absence.jours_ouvres > 1 ? "s" : ""} ouvré${absence.jours_ouvres > 1 ? "s" : ""}`
                  : "-"}
              </dd>
            </div>
          </div>

          {absence.motif && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 bg-purple-50 rounded-md">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Motif
                </dt>
                <dd className="text-sm text-gray-900 line-clamp-2">
                  {absence.motif}
                </dd>
              </div>
            </div>
          )}
        </dl>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => handleViewDetail(absence)}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Voir les détails
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleValidate(absence.id, niveau, "refusee")}
              disabled={loading === absence.id}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Refuser"
            >
              {loading === absence.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleValidate(absence.id, niveau, "validee")}
              disabled={loading === absence.id}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Valider"
            >
              {loading === absence.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Section Validation N+1 */}
      {canValidateN1 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Validation N+1
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Demandes de votre équipe en attente de validation
              </p>
            </div>
            {absencesN1.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {absencesN1.length} en attente
              </span>
            )}
          </div>

          {absencesN1.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">
                Aucune demande en attente de validation N+1
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {absencesN1.map((abs) => (
                <AbsenceCard key={abs.id} absence={abs} niveau="n1" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Validation RH */}
      {canValidateRH && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Validation RH
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Demandes validées N+1 en attente de validation RH
              </p>
            </div>
            {absencesRH.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                {absencesRH.length} en attente
              </span>
            )}
          </div>

          {absencesRH.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">
                Aucune demande en attente de validation RH
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {absencesRH.map((abs) => (
                <AbsenceCard key={abs.id} absence={abs} niveau="rh" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Détails */}
      {modalDetailOpen && selectedAbsence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-600/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Détails de la demande
              </h2>
              <button
                onClick={() => {
                  setModalDetailOpen(false);
                  setSelectedAbsence(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Collaborateur
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {selectedAbsence.collaborateur?.prenom}{" "}
                    {selectedAbsence.collaborateur?.nom}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Type
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {selectedAbsence.catalogue_absence?.libelle ||
                      selectedAbsence.type}
                  </dd>
                </div>
              </div>

              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Période
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {format(new Date(selectedAbsence.date_debut), "dd/MM/yyyy", {
                    locale: fr,
                  })}{" "}
                  -{" "}
                  {format(new Date(selectedAbsence.date_fin), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </dd>
              </div>

              {selectedAbsence.motif && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Motif
                  </dt>
                  <dd className="text-sm text-gray-900">{selectedAbsence.motif}</dd>
                </div>
              )}

              {selectedAbsence.commentaire && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Commentaire
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {selectedAbsence.commentaire}
                  </dd>
                </div>
              )}

              {/* Historique */}
              {selectedAbsence.historique &&
                selectedAbsence.historique.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Historique des validations
                    </dt>
                    <div className="space-y-2">
                      {selectedAbsence.historique.map((hist: any) => (
                        <div
                          key={hist.id}
                          className="bg-gray-50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {hist.niveau_validation.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              {format(new Date(hist.date_action), "dd/MM/yyyy à HH:mm", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Action: {hist.action} - {hist.commentaire || "Aucun commentaire"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

