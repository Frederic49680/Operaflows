"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Award,
  Radio,
  Stethoscope,
  Calendar,
  ChevronLeft,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar as CalendarIcon,
  FileText,
} from "lucide-react";
import type {
  Collaborateur,
  Habilitation,
  Dosimetrie,
  VisiteMedicale,
  Absence,
  Formation,
} from "@/types/rh";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Modal from "@/components/rh/Modal";
import HabilitationForm from "@/components/rh/forms/HabilitationForm";
import AbsenceForm from "@/components/rh/forms/AbsenceForm";
import DosimetrieForm from "@/components/rh/forms/DosimetrieForm";
import VisiteMedicaleForm from "@/components/rh/forms/VisiteMedicaleForm";

interface CollaborateurDetailClientProps {
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
  hasRHAccess: boolean;
  sites: Array<{ site_id: string; site_code: string; site_label: string }>;
  responsables: Array<{ id: string; nom: string; prenom: string }>;
  availableUsers: Array<{ id: string; email: string }>;
}

type Tab = "general" | "competences" | "dosimetrie" | "medical" | "absences";

export default function CollaborateurDetailClient({
  collaborateur,
  habilitations,
  dosimetries,
  visitesMedicales,
  absences,
  formations,
  competences,
  hasRHAccess,
  sites,
  responsables,
  availableUsers,
}: CollaborateurDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [modalHabilitationOpen, setModalHabilitationOpen] = useState(false);
  const [selectedHabilitation, setSelectedHabilitation] = useState<Habilitation | null>(null);
  const [modalAbsenceOpen, setModalAbsenceOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalDosimetrieOpen, setModalDosimetrieOpen] = useState(false);
  const [selectedDosimetrie, setSelectedDosimetrie] = useState<Dosimetrie | null>(null);
  const [modalVisiteOpen, setModalVisiteOpen] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState<VisiteMedicale | null>(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshData = () => {
    router.refresh();
  };

  const tabs = [
    { id: "general" as Tab, label: "Informations générales", icon: User },
    { id: "competences" as Tab, label: "Compétences & Habilitations", icon: Award },
    { id: "dosimetrie" as Tab, label: "Dosimétrie & RTR", icon: Radio },
    { id: "medical" as Tab, label: "Visites médicales", icon: Stethoscope },
    { id: "absences" as Tab, label: "Absences", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            href="/rh"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            Retour à la liste
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                {collaborateur.prenom} {collaborateur.nom}
              </h1>
              <div className="flex items-center gap-4 text-secondary">
                <span>{collaborateur.email}</span>
                {collaborateur.telephone && (
                  <span>{collaborateur.telephone}</span>
                )}
                {collaborateur.fonction_metier && (
                  <span className="text-gray-500">
                    {collaborateur.fonction_metier}
                  </span>
                )}
              </div>
            </div>
            {hasRHAccess && (
              <button
                onClick={() => setModalEditOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="h-5 w-5" />
                Modifier
              </button>
            )}
          </div>
        </div>

        {/* Badges statut */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              collaborateur.statut === "actif"
                ? "bg-green-100 text-green-800"
                : collaborateur.statut === "inactif"
                ? "bg-gray-100 text-gray-800"
                : collaborateur.statut === "suspendu"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {collaborateur.statut}
          </span>
          {collaborateur.type_contrat && (
            <span className="text-sm text-gray-600">
              {collaborateur.type_contrat}
            </span>
          )}
          {collaborateur.site && (
            <span className="text-sm text-gray-600">{collaborateur.site}</span>
          )}
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="card">
          {activeTab === "general" && (
            <OngletGeneral collaborateur={collaborateur} />
          )}
          {activeTab === "competences" && (
            <OngletCompetences
              habilitations={habilitations}
              competences={competences}
              hasRHAccess={hasRHAccess}
              onAddHabilitation={() => {
                setSelectedHabilitation(null);
                setModalHabilitationOpen(true);
              }}
              onEditHabilitation={(hab) => {
                setSelectedHabilitation(hab);
                setModalHabilitationOpen(true);
              }}
            />
          )}
          {activeTab === "dosimetrie" && (
            <OngletDosimetrie
              dosimetries={dosimetries}
              hasRHAccess={hasRHAccess}
              onAddDosimetrie={() => {
                setSelectedDosimetrie(null);
                setModalDosimetrieOpen(true);
              }}
              onEditDosimetrie={(dos) => {
                setSelectedDosimetrie(dos);
                setModalDosimetrieOpen(true);
              }}
            />
          )}
          {activeTab === "medical" && (
            <OngletMedical
              visitesMedicales={visitesMedicales}
              hasRHAccess={hasRHAccess}
              onAddVisite={() => {
                setSelectedVisite(null);
                setModalVisiteOpen(true);
              }}
              onEditVisite={(vm) => {
                setSelectedVisite(vm);
                setModalVisiteOpen(true);
              }}
            />
          )}
          {activeTab === "absences" && (
            <OngletAbsences
              absences={absences}
              formations={formations}
              canValidate={hasRHAccess || false}
              hasRHAccess={hasRHAccess}
              onAddAbsence={() => {
                setSelectedAbsence(null);
                setModalAbsenceOpen(true);
              }}
              onEditAbsence={(abs) => {
                setSelectedAbsence(abs);
                setModalAbsenceOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Modal Habilitation */}
      <Modal
        isOpen={modalHabilitationOpen}
        onClose={() => {
          setModalHabilitationOpen(false);
          setSelectedHabilitation(null);
        }}
        title={selectedHabilitation ? "Modifier l'habilitation" : "Nouvelle habilitation"}
        size="lg"
      >
        <HabilitationForm
          collaborateurId={collaborateur.id}
          habilitation={selectedHabilitation}
          onClose={() => {
            setModalHabilitationOpen(false);
            setSelectedHabilitation(null);
          }}
          onSuccess={refreshData}
        />
      </Modal>

      {/* Modal Absence */}
      <Modal
        isOpen={modalAbsenceOpen}
        onClose={() => {
          setModalAbsenceOpen(false);
          setSelectedAbsence(null);
        }}
        title={selectedAbsence ? "Modifier l'absence" : "Nouvelle absence"}
        size="lg"
      >
        <AbsenceForm
          collaborateurId={collaborateur.id}
          absence={selectedAbsence}
          onClose={() => {
            setModalAbsenceOpen(false);
            setSelectedAbsence(null);
          }}
          onSuccess={refreshData}
        />
      </Modal>

      {/* Modal Dosimétrie */}
      <Modal
        isOpen={modalDosimetrieOpen}
        onClose={() => {
          setModalDosimetrieOpen(false);
          setSelectedDosimetrie(null);
        }}
        title={selectedDosimetrie ? "Modifier le relevé dosimétrique" : "Nouveau relevé dosimétrique"}
        size="lg"
      >
        <DosimetrieForm
          collaborateurId={collaborateur.id}
          dosimetrie={selectedDosimetrie}
          onClose={() => {
            setModalDosimetrieOpen(false);
            setSelectedDosimetrie(null);
          }}
          onSuccess={() => {
            refreshData();
          }}
        />
      </Modal>

      {/* Modal Visite médicale */}
      <Modal
        isOpen={modalVisiteOpen}
        onClose={() => {
          setModalVisiteOpen(false);
          setSelectedVisite(null);
        }}
        title={selectedVisite ? "Modifier la visite médicale" : "Nouvelle visite médicale"}
        size="lg"
      >
        <VisiteMedicaleForm
          collaborateurId={collaborateur.id}
          visite={selectedVisite}
          onClose={() => {
            setModalVisiteOpen(false);
            setSelectedVisite(null);
          }}
          onSuccess={() => {
            refreshData();
          }}
        />
      </Modal>

      {/* Modal Édition Collaborateur */}
      <Modal
        isOpen={modalEditOpen}
        onClose={() => {
          setModalEditOpen(false);
          setError(null);
          setSuccess(null);
        }}
        title="Modifier le collaborateur"
        size="xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);
            setLoading(true);

            try {
              const formData = new FormData(e.currentTarget);
              const updateData: Record<string, unknown> = {};

              // Récupérer toutes les valeurs du formulaire
              const nom = formData.get("nom") as string;
              const prenom = formData.get("prenom") as string;
              const email = formData.get("email") as string;
              const telephone = formData.get("telephone") as string;
              const fonction_metier = formData.get("fonction_metier") as string;
              const site_id = formData.get("site_id") as string;
              const type_contrat = formData.get("type_contrat") as string;
              const responsable_activite_id = formData.get("responsable_activite_id") as string;
              const user_id = formData.get("user_id") as string;
              const date_embauche = formData.get("date_embauche") as string;
              const date_fin_contrat = formData.get("date_fin_contrat") as string;
              const statut = formData.get("statut") as string;
              const commentaire = formData.get("commentaire") as string;

              // Validation
              if (!nom || !prenom || !email) {
                throw new Error("Nom, prénom et email sont obligatoires");
              }

              // Préparer les données
              updateData.nom = nom.trim();
              updateData.prenom = prenom.trim();
              updateData.email = email.trim();
              updateData.telephone = telephone.trim() || null;
              updateData.fonction_metier = fonction_metier.trim() || null;
              updateData.site_id = site_id || null;
              updateData.type_contrat = type_contrat || "CDI";
              updateData.responsable_activite_id = responsable_activite_id || null;
              updateData.user_id = user_id || null;
              updateData.date_embauche = date_embauche || null;
              updateData.date_fin_contrat = date_fin_contrat || null;
              updateData.statut = statut || "actif";
              updateData.commentaire = commentaire.trim() || null;

              // Nettoyer les valeurs vides
              Object.keys(updateData).forEach((key) => {
                if (updateData[key] === "") {
                  updateData[key] = null;
                }
              });

              // Log de debug en développement
              if (process.env.NODE_ENV === "development") {
                console.log("🔍 DEBUG - Données à envoyer:", updateData);
                console.log("🔍 DEBUG - ID collaborateur:", collaborateur.id);
              }

              // Envoyer la requête PATCH
              const response = await fetch(`/api/rh/collaborateurs/${collaborateur.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
              });

              const responseData = await response.json();

              if (!response.ok) {
                console.error("❌ Erreur API:", responseData);
                throw new Error(
                  responseData.error || 
                  responseData.details || 
                  `Erreur ${response.status}: ${response.statusText}`
                );
              }

              // Log de succès en développement
              if (process.env.NODE_ENV === "development") {
                console.log("✅ Succès - Collaborateur mis à jour:", responseData);
              }

              setSuccess("Collaborateur mis à jour avec succès");
              setTimeout(() => {
                setModalEditOpen(false);
                setError(null);
                setSuccess(null);
                refreshData();
              }, 1500);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-6"
        >
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-r-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Section Informations personnelles */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations personnelles
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nom"
                  defaultValue={collaborateur.nom}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                  placeholder="Nom de famille"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="prenom"
                  defaultValue={collaborateur.prenom}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                  placeholder="Prénom"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  defaultValue={collaborateur.email}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                  placeholder="email@exemple.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="telephone"
                  defaultValue={collaborateur.telephone || ""}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                  placeholder="06 12 34 56 78"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Section Informations professionnelles */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Informations professionnelles
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonction métier
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fonction_metier"
                  defaultValue={collaborateur.fonction_metier || ""}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                  placeholder="Ex: Conducteur de travaux"
                />
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site principal
              </label>
              <div className="relative">
                <select
                  name="site_id"
                  defaultValue={collaborateur.site_id || ""}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all appearance-none"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map((site) => (
                    <option key={site.site_id} value={site.site_id}>
                      {site.site_code} - {site.site_label}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contrat
              </label>
              <select
                name="type_contrat"
                defaultValue={collaborateur.type_contrat || "CDI"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Interim">Intérim</option>
                <option value="Apprenti">Apprenti</option>
                <option value="Stagiaire">Stagiaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable d'activité
              </label>
              <select
                name="responsable_activite_id"
                defaultValue={collaborateur.responsable_activite_id || ""}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
              >
                <option value="">Auto (selon le site)</option>
                {responsables.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.prenom} {resp.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compte utilisateur associé
              </label>
              <select
                name="user_id"
                defaultValue={collaborateur.user_id || ""}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut"
                defaultValue={collaborateur.statut || "actif"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
            </div>
          </div>

          {/* Section Dates */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Dates importantes
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'embauche
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date_embauche"
                  defaultValue={
                    collaborateur.date_embauche
                      ? new Date(collaborateur.date_embauche).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin de contrat
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date_fin_contrat"
                  defaultValue={
                    collaborateur.date_fin_contrat
                      ? new Date(collaborateur.date_fin_contrat).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all"
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            </div>
          </div>

          {/* Section Commentaire */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Notes et commentaires
              </h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire
              </label>
              <textarea
                name="commentaire"
                defaultValue={collaborateur.commentaire || ""}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 transition-all resize-none"
                placeholder="Notes supplémentaires sur ce collaborateur..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setModalEditOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Onglet Informations générales
function OngletGeneral({ collaborateur }: { collaborateur: Collaborateur }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Identité</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nom</dt>
              <dd className="mt-1 text-sm text-gray-900">{collaborateur.nom}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Prénom</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {collaborateur.prenom}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {collaborateur.email}
              </dd>
            </div>
            {collaborateur.telephone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {collaborateur.telephone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Contrat</h3>
          <dl className="space-y-3">
            {collaborateur.type_contrat && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Type de contrat
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {collaborateur.type_contrat}
                </dd>
              </div>
            )}
            {collaborateur.date_embauche && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Date d'embauche
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(collaborateur.date_embauche), "PPP", {
                    locale: fr,
                  })}
                </dd>
              </div>
            )}
            {collaborateur.date_fin_contrat && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Date de fin de contrat
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(collaborateur.date_fin_contrat), "PPP", {
                    locale: fr,
                  })}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Statut</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    collaborateur.statut === "actif"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {collaborateur.statut}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Affectation</h3>
          <dl className="space-y-3">
            {collaborateur.site && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Site</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {collaborateur.site}
                </dd>
              </div>
            )}
            {collaborateur.fonction_metier && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Fonction métier
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {collaborateur.fonction_metier}
                </dd>
              </div>
            )}
            {collaborateur.responsable && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Responsable
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {collaborateur.responsable.prenom}{" "}
                  {collaborateur.responsable.nom}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {collaborateur.commentaire && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Commentaire</h3>
            <p className="text-sm text-gray-900">{collaborateur.commentaire}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Onglet Compétences & Habilitations
function OngletCompetences({
  habilitations,
  competences,
  hasRHAccess,
  onAddHabilitation,
  onEditHabilitation,
}: {
  habilitations: Habilitation[];
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
  hasRHAccess: boolean;
  onAddHabilitation: () => void;
  onEditHabilitation: (hab: Habilitation) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette habilitation ?")) return;
    
    try {
      const { createClientSupabase } = await import("@/lib/supabase/client");
      const supabase = createClientSupabase();
      const { error } = await supabase.from("habilitations").delete().eq("id", id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Habilitations</h3>
        {hasRHAccess && (
          <button onClick={onAddHabilitation} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une habilitation
          </button>
        )}
      </div>

      {habilitations.length === 0 ? (
        <p className="text-gray-500">Aucune habilitation enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Libellé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date obtention
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Organisme
                </th>
                {hasRHAccess && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {habilitations.map((hab) => (
                <tr key={hab.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hab.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hab.libelle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(hab.date_obtention), "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hab.date_expiration
                      ? format(new Date(hab.date_expiration), "dd/MM/yyyy")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        hab.statut === "valide"
                          ? "bg-green-100 text-green-800"
                          : hab.statut === "expire"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {hab.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hab.organisme || "-"}
                  </td>
                  {hasRHAccess && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditHabilitation(hab)}
                          className="text-primary hover:text-primary-dark"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hab.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Compétences</h3>
          {hasRHAccess && (
          <button className="btn-primary text-sm">Ajouter une compétence</button>
        )}
        </div>

        {competences.length === 0 ? (
          <p className="text-gray-500">Aucune compétence enregistrée</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competences.map((comp) => (
              <div key={comp.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{comp.competence?.libelle}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      comp.statut === "valide"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {comp.statut}
                  </span>
                </div>
                {comp.date_obtention && (
                  <p className="text-sm text-gray-500 mt-1">
                    Obtention:{" "}
                    {format(new Date(comp.date_obtention), "dd/MM/yyyy")}
                  </p>
                )}
                {comp.date_expiration && (
                  <p className="text-sm text-gray-500">
                    Expiration:{" "}
                    {format(new Date(comp.date_expiration), "dd/MM/yyyy")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Onglet Dosimétrie
function OngletDosimetrie({
  dosimetries,
  hasRHAccess,
  onAddDosimetrie,
  onEditDosimetrie,
}: {
  dosimetries: Dosimetrie[];
  hasRHAccess: boolean;
  onAddDosimetrie: () => void;
  onEditDosimetrie: (dos: Dosimetrie) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce relevé dosimétrique ?")) return;
    
    try {
      const { createClientSupabase } = await import("@/lib/supabase/client");
      const supabase = createClientSupabase();
      const { error } = await supabase.from("dosimetrie").delete().eq("id", id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Suivi dosimétrique</h3>
        {hasRHAccess && (
          <button onClick={onAddDosimetrie} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un relevé
          </button>
        )}
      </div>

      {dosimetries.length === 0 ? (
        <p className="text-gray-500">Aucun relevé dosimétrique</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Dosimètre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dose trimestrielle (mSv)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dose annuelle (mSv)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Limite (mSv)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fournisseur
                </th>
                {hasRHAccess && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dosimetries.map((dos) => (
                <tr key={dos.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dos.numero_dosimetre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(dos.periode_debut), "dd/MM/yyyy")} -{" "}
                    {format(new Date(dos.periode_fin), "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dos.dose_trimestrielle_mSv.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dos.dose_annuelle_mSv.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dos.limite_reglementaire_mSv}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dos.fournisseur || "-"}
                  </td>
                  {hasRHAccess && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditDosimetrie(dos)}
                          className="text-primary hover:text-primary-dark"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dos.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Onglet Visites médicales
function OngletMedical({
  visitesMedicales,
  hasRHAccess,
  onAddVisite,
  onEditVisite,
}: {
  visitesMedicales: VisiteMedicale[];
  hasRHAccess: boolean;
  onAddVisite: () => void;
  onEditVisite: (vm: VisiteMedicale) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette visite médicale ?")) return;
    
    try {
      const { createClientSupabase } = await import("@/lib/supabase/client");
      const supabase = createClientSupabase();
      const { error } = await supabase.from("visites_medicales").delete().eq("id", id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visites médicales</h3>
        {hasRHAccess && (
          <button onClick={onAddVisite} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une visite
          </button>
        )}
      </div>

      {visitesMedicales.length === 0 ? (
        <p className="text-gray-500">Aucune visite médicale enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date visite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prochaine visite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Centre médical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avis médical
                </th>
                {hasRHAccess && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitesMedicales.map((vm) => (
                <tr key={vm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vm.type_visite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(vm.date_visite), "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vm.date_prochaine_visite
                      ? format(new Date(vm.date_prochaine_visite), "dd/MM/yyyy")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vm.centre_medical || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vm.statut === "apte"
                          ? "bg-green-100 text-green-800"
                          : vm.statut === "inapte"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {vm.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vm.avis_medical || "-"}
                  </td>
                  {hasRHAccess && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditVisite(vm)}
                          className="text-primary hover:text-primary-dark"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vm.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Onglet Absences
function OngletAbsences({
  absences,
  formations,
  canValidate,
  hasRHAccess,
  onAddAbsence,
  onEditAbsence,
}: {
  absences: Absence[];
  formations: Formation[];
  canValidate: boolean;
  hasRHAccess: boolean;
  onAddAbsence: () => void;
  onEditAbsence: (abs: Absence) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) return;
    
    try {
      const { createClientSupabase } = await import("@/lib/supabase/client");
      const supabase = createClientSupabase();
      const { error } = await supabase.from("absences").delete().eq("id", id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const handleValidate = async (id: string, statut: "validee" | "refusee") => {
    try {
      const { createClientSupabase } = await import("@/lib/supabase/client");
      const supabase = createClientSupabase();
      const { error } = await supabase
        .from("absences")
        .update({
          statut,
          date_validation: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la validation");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Absences</h3>
        {(hasRHAccess || canValidate) && (
          <button onClick={onAddAbsence} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle absence
          </button>
        )}
      </div>

      {absences.length === 0 ? (
        <p className="text-gray-500">Aucune absence enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Validé par
                </th>
                {(hasRHAccess || canValidate) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {absences.map((abs) => (
                <tr key={abs.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeLabels[abs.type] || abs.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(abs.date_debut), "dd/MM/yyyy")} -{" "}
                    {format(new Date(abs.date_fin), "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {abs.duree_jours?.toFixed(1) || "-"} jour
                    {abs.duree_jours && abs.duree_jours > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        abs.statut === "validee"
                          ? "bg-green-100 text-green-800"
                          : abs.statut === "refusee"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {abs.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {abs.valide_par_user?.email || "-"}
                  </td>
                  {(hasRHAccess || canValidate) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {abs.statut === "en_attente" && canValidate && (
                          <>
                            <button
                              onClick={() => handleValidate(abs.id, "validee")}
                              className="text-green-600 hover:text-green-900"
                              title="Valider"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => handleValidate(abs.id, "refusee")}
                              className="text-red-600 hover:text-red-900"
                              title="Refuser"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        {hasRHAccess && (
                          <>
                            <button
                              onClick={() => onEditAbsence(abs)}
                              className="text-primary hover:text-primary-dark"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(abs.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Formations</h3>
        {formations.length === 0 ? (
          <p className="text-gray-500">Aucune formation enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Libellé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formations.map((form) => (
                  <tr key={form.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {form.libelle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(form.date_debut), "dd/MM/yyyy")}
                      {form.date_fin &&
                        ` - ${format(new Date(form.date_fin), "dd/MM/yyyy")}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          form.statut === "terminee"
                            ? "bg-green-100 text-green-800"
                            : form.statut === "en_cours"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {form.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

