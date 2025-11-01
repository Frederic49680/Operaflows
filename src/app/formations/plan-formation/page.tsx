import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import PlanFormationClient from "./plan-formation-client";

export default async function PlanFormationPage() {
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

  const currentYear = new Date().getFullYear();

  // Récupérer les formations
  const { data: formations, error } = await supabase
    .from("formations")
    .select(`
      *,
      collaborateur:collaborateurs!formations_collaborateur_id_fkey(id, nom, prenom, email, site_id),
      catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie),
      plan_previsionnel:tbl_plan_previsionnel_formations(id, periode_annee)
    `)
    .gte("date_debut", `${currentYear}-01-01`)
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("Erreur récupération formations:", error);
  }

  // Récupérer les collaborateurs
  const { data: collaborateurs } = await supabase
    .from("collaborateurs")
    .select("id, nom, prenom, email")
    .eq("statut", "actif")
    .order("nom", { ascending: true });

  // Récupérer le catalogue
  const { data: catalogue } = await supabase
    .from("tbl_catalogue_formations")
    .select("id, nom, code_interne")
    .eq("is_active", true)
    .order("nom", { ascending: true });

  return (
    <PlanFormationClient
      initialFormations={formations || []}
      collaborateurs={collaborateurs || []}
      catalogue={catalogue || []}
      currentYear={currentYear}
    />
  );
}

