"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import CollaborateurDetailClient from "@/app/rh/[id]/collaborateur-detail-client";
import type {
  Collaborateur,
  Habilitation,
  Dosimetrie,
  VisiteMedicale,
  Absence,
  Formation,
} from "@/types/rh";

interface CollaborateurDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborateurId: string;
  onUpdate?: () => void; // Callback pour rafraîchir la liste après modification
}

export default function CollaborateurDetailModal({
  isOpen,
  onClose,
  collaborateurId,
  onUpdate,
}: CollaborateurDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    collaborateur: Collaborateur;
    habilitations: Habilitation[];
    dosimetries: Dosimetrie[];
    visitesMedicales: VisiteMedicale[];
    absences: Absence[];
    formations: Formation[];
    competences: Array<{
      id: string;
      collaborateur_id: string;
      competence_id: string;
      niveau?: string | null;
      date_obtention?: string | null;
      date_expiration?: string | null;
      statut: string;
      competence?: {
        id: string;
        libelle: string;
      } | null;
    }>;
    sites: Array<{ site_id: string; site_code: string; site_label: string }>;
    responsables: Array<{ id: string; nom: string; prenom: string }>;
    availableUsers: Array<{ id: string; email: string }>;
    hasRHAccess: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen && collaborateurId) {
      fetchCollaborateurDetail();
    } else {
      // Reset quand le modal se ferme
      setData(null);
      setError(null);
    }
  }, [isOpen, collaborateurId]);

  const fetchCollaborateurDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rh/collaborateurs/${collaborateurId}/detail`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Gérer la fermeture avec rafraîchissement
  const handleClose = () => {
    onClose();
    if (onUpdate) {
      onUpdate(); // Rafraîchir la liste si callback fourni
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal - Très large pour le contenu */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col z-50 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {data?.collaborateur ? `${data.collaborateur.prenom} ${data.collaborateur.nom}` : "Détails du collaborateur"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background" onClick={(e) => e.stopPropagation()}>
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg">
                <p className="font-medium">Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="p-6">
              <CollaborateurDetailClient
                collaborateur={data.collaborateur}
                habilitations={data.habilitations}
                dosimetries={data.dosimetries}
                visitesMedicales={data.visitesMedicales}
                absences={data.absences}
                formations={data.formations}
                competences={data.competences}
                hasRHAccess={data.hasRHAccess}
                sites={data.sites}
                responsables={data.responsables}
                availableUsers={data.availableUsers}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

