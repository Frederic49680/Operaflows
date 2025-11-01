import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { canValidateAbsences, isRHOrAdmin } from "@/lib/auth/rh-check";
import DemandesAbsencesClient from "./demandes-absences-client";

export default async function DemandesAbsencesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le collaborateur de l'utilisateur
  const { data: collaborateur } = await supabase
    .from("collaborateurs")
    .select("id, nom, prenom, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Vérifier les droits
  const canValidate = await canValidateAbsences(user.id);
  const hasRHAccess = await isRHOrAdmin(user.id);

  // Récupérer les collaborateurs disponibles selon les droits
  let collaborateursDisponibles: Array<{ id: string; nom: string; prenom: string; email: string; user_id: string | null }> = [];
  
  if (hasRHAccess) {
    // Admin/RH peut créer pour tous les collaborateurs
    const { data: tousCollaborateurs } = await supabase
      .from("collaborateurs")
      .select("id, nom, prenom, email, user_id")
      .eq("statut", "actif")
      .order("nom", { ascending: true });

    if (tousCollaborateurs) {
      collaborateursDisponibles = tousCollaborateurs.map((c) => ({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        user_id: c.user_id,
      }));
    }
  } else if (canValidate && collaborateur) {
    // N+1 peut créer pour son équipe sans compte uniquement
    const { data: equipe } = await supabase
      .from("collaborateurs")
      .select("id, nom, prenom, email, user_id, responsable_id, responsable_activite_id")
      .or(`responsable_id.eq.${collaborateur.id},responsable_activite_id.eq.${collaborateur.id}`)
      .eq("statut", "actif");

    if (equipe) {
      // Filtrer ceux qui n'ont pas de compte (user_id IS NULL)
      collaborateursDisponibles = equipe
        .filter((c) => !c.user_id)
        .map((c) => ({
          id: c.id,
          nom: c.nom,
          prenom: c.prenom,
          email: c.email,
          user_id: c.user_id,
        }));
    }
  }

  let mesAbsences: any[] = [];
  if (collaborateur) {
    const { data: absences } = await supabase
      .from("absences")
      .select(`
        *,
        catalogue_absence:catalogue_absences!absences_catalogue_absence_id_fkey(*)
      `)
      .eq("collaborateur_id", collaborateur.id)
      .order("date_debut", { ascending: false });

    mesAbsences = absences || [];
  }

  // Récupérer le catalogue des absences actives
  const { data: catalogue } = await supabase
    .from("catalogue_absences")
    .select("*")
    .eq("is_active", true)
    .order("code", { ascending: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Mes Demandes d&apos;Absence
          </h1>
          <p className="text-lg text-secondary">
          Consultez et créez vos demandes d&apos;absence
          {hasRHAccess && (
            <span className="ml-2 text-sm text-primary">
              (en tant qu&apos;administrateur, vous pouvez créer pour n&apos;importe quel collaborateur - validation automatique)
            </span>
          )}
          {!hasRHAccess && canValidate && collaborateursDisponibles.length > 0 && (
            <span className="ml-2 text-sm text-primary">
              (vous pouvez également créer pour {collaborateursDisponibles.length} collaborateur{collaborateursDisponibles.length > 1 ? "s" : ""} sans compte)
            </span>
          )}
        </p>
      </div>

      <DemandesAbsencesClient
        initialAbsences={mesAbsences}
        catalogue={catalogue || []}
        collaborateurId={collaborateur?.id || null}
        canValidate={canValidate}
        hasRHAccess={hasRHAccess}
        collaborateursDisponibles={collaborateursDisponibles}
      />
      </div>
    </div>
  );
}

