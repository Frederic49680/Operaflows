import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRHOrAdmin, canValidateAbsences } from "@/lib/auth/rh-check";
import ValidationAbsencesClient from "./validation-absences-client";

export default async function ValidationAbsencesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasRHAccess = await isRHOrAdmin(user.id);
  const canValidate = await canValidateAbsences(user.id);

  if (!hasRHAccess && !canValidate) {
    redirect("/unauthorized");
  }

  // Récupérer le collaborateur pour déterminer qui on supervise
  const { data: monCollaborateur } = await supabase
    .from("collaborateurs")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Absences en attente de validation N+1 (pour les responsables)
  let absencesN1: any[] = [];
  if (canValidate && monCollaborateur) {
    const { data: absences } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, nom, prenom, email, user_id, responsable_id, responsable_activite_id),
        catalogue_absence:catalogue_absences!absences_catalogue_absence_id_fkey(*)
      `)
      .eq("statut", "en_attente_validation_n1")
      .order("date_debut", { ascending: true });

    if (absences) {
      // Filtrer pour ne garder que celles de son équipe
      absencesN1 = absences.filter((abs) => {
        const collab = abs.collaborateur;
        return (
          collab?.responsable_id === monCollaborateur.id ||
          collab?.responsable_activite_id === monCollaborateur.id
        );
      });
    }
  }

  // Absences en attente de validation RH (pour les RH/Admin)
  let absencesRH: any[] = [];
  if (hasRHAccess) {
    const { data: absences } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, nom, prenom, email, user_id),
        catalogue_absence:catalogue_absences!absences_catalogue_absence_id_fkey(*)
      `)
      .eq("statut", "en_attente_validation_rh")
      .order("date_debut", { ascending: true });

    absencesRH = absences || [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Validation des Absences
        </h1>
        <p className="text-gray-600">
          Validez ou refusez les demandes d&apos;absence en attente
        </p>
      </div>

      <ValidationAbsencesClient
        absencesN1={absencesN1}
        absencesRH={absencesRH}
        canValidateN1={canValidate}
        canValidateRH={hasRHAccess}
      />
    </div>
  );
}

