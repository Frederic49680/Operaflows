"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Award,
  Radio,
  Stethoscope,
  Calendar,
  ChevronLeft,
  Edit,
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

interface CollaborateurDetailClientProps {
  collaborateur: Collaborateur;
  habilitations: Habilitation[];
  dosimetries: Dosimetrie[];
  visitesMedicales: VisiteMedicale[];
  absences: Absence[];
  formations: Formation[];
  competences: any[];
  hasRHAccess: boolean;
  currentUserId: string;
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
  currentUserId,
}: CollaborateurDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

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
              <Link
                href={`/rh/${collaborateur.id}/edit`}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="h-5 w-5" />
                Modifier
              </Link>
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
            />
          )}
          {activeTab === "dosimetrie" && (
            <OngletDosimetrie
              dosimetries={dosimetries}
              hasRHAccess={hasRHAccess}
            />
          )}
          {activeTab === "medical" && (
            <OngletMedical
              visitesMedicales={visitesMedicales}
              hasRHAccess={hasRHAccess}
            />
          )}
          {activeTab === "absences" && (
            <OngletAbsences
              absences={absences}
              formations={formations}
              hasRHAccess={hasRHAccess}
              canValidate={hasRHAccess || false} // TODO: vérifier si responsable
              collaborateurId={collaborateur.id}
            />
          )}
        </div>
      </div>
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
}: {
  habilitations: Habilitation[];
  competences: any[];
  hasRHAccess: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Habilitations</h3>
        {hasRHAccess && (
          <button className="btn-primary text-sm">Ajouter une habilitation</button>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {habilitations.map((hab) => (
                <tr key={hab.id}>
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
}: {
  dosimetries: Dosimetrie[];
  hasRHAccess: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Suivi dosimétrique</h3>
        {hasRHAccess && (
          <button className="btn-primary text-sm">Ajouter un relevé</button>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dosimetries.map((dos) => (
                <tr key={dos.id}>
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
}: {
  visitesMedicales: VisiteMedicale[];
  hasRHAccess: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visites médicales</h3>
        {hasRHAccess && (
          <button className="btn-primary text-sm">Ajouter une visite</button>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitesMedicales.map((vm) => (
                <tr key={vm.id}>
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
  hasRHAccess,
  canValidate,
}: {
  absences: Absence[];
  formations: Formation[];
  hasRHAccess: boolean;
  canValidate: boolean;
}) {
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
        <button className="btn-primary text-sm">Nouvelle absence</button>
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
                {canValidate && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                  {canValidate && abs.statut === "en_attente" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Valider
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Refuser
                      </button>
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

