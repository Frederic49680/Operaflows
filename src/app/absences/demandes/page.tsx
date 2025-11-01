import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DemandesAbsencesClient from "./demandes-absences-client";

export default async function DemandesAbsencesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer les absences de l'utilisateur
  const { data: collaborateur } = await supabase
    .from("collaborateurs")
    .select("id, nom, prenom, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

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
        </p>
      </div>

      <DemandesAbsencesClient
        initialAbsences={mesAbsences}
        catalogue={catalogue || []}
        collaborateurId={collaborateur?.id || null}
      />
    </div>
  );
}

