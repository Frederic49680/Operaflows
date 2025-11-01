import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import SuiviAbsencesClient from "./suivi-absences-client";

export default async function SuiviAbsencesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasRHAccess = await isRHOrAdmin(user.id);
  if (!hasRHAccess) {
    redirect("/unauthorized");
  }

  // Récupérer les statistiques de base
  const { data: absences } = await supabase
    .from("absences")
    .select(`
      *,
      collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, nom, prenom, email, site_id),
      catalogue_absence:catalogue_absences!absences_catalogue_absence_id_fkey(*)
    `)
    .order("date_debut", { ascending: false })
    .limit(100); // Limiter pour les performances

  // Récupérer les sites pour les filtres
  const { data: sites } = await supabase
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Tableau de Bord - Suivi des Absences
          </h1>
          <p className="text-lg text-secondary">
          Indicateurs et suivi global des absences
        </p>
      </div>

      <SuiviAbsencesClient
        initialAbsences={absences || []}
        sites={sites || []}
      />
      </div>
    </div>
  );
}

