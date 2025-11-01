import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { canValidateAbsences } from "@/lib/auth/rh-check";
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

  // Vérifier si l'utilisateur est N+1 (peut valider des absences)
  const canValidate = await canValidateAbsences(user.id);

  // Récupérer les collaborateurs de l'équipe (sans compte) si N+1
  let equipeSansCompte: Array<{ id: string; nom: string; prenom: string; email: string }> = [];
  if (canValidate && collaborateur) {
    // Récupérer les collaborateurs dont le responsable est l'utilisateur actuel
    const { data: equipe } = await supabase
      .from("collaborateurs")
      .select("id, nom, prenom, email, user_id, responsable_id, responsable_activite_id")
      .or(`responsable_id.eq.${collaborateur.id},responsable_activite_id.eq.${collaborateur.id}`)
      .eq("statut", "actif");

    if (equipe) {
      // Filtrer ceux qui n'ont pas de compte (user_id IS NULL)
      equipeSansCompte = equipe
        .filter((c) => !c.user_id)
        .map((c) => ({
          id: c.id,
          nom: c.nom,
          prenom: c.prenom,
          email: c.email,
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mes Demandes d&apos;Absence
        </h1>
        <p className="text-gray-600">
          Consultez et créez vos demandes d&apos;absence
          {canValidate && equipeSansCompte.length > 0 && (
            <span className="ml-2 text-sm text-primary">
              (vous pouvez également créer pour {equipeSansCompte.length} collaborateur{equipeSansCompte.length > 1 ? "s" : ""} sans compte)
            </span>
          )}
        </p>
      </div>

      <DemandesAbsencesClient
        initialAbsences={mesAbsences}
        catalogue={catalogue || []}
        collaborateurId={collaborateur?.id || null}
        canValidate={canValidate}
        equipeSansCompte={equipeSansCompte}
      />
    </div>
  );
}

