import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import PlanPrevisionnelClient from "./plan-previsionnel-client";

export default async function PlanPrevisionnelPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasRHAccess = await isRHOrAdmin(user.id);

  // Récupérer l'année en cours ou demandée
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Récupérer le plan prévisionnel
  const { data: planPrevisionnel, error } = await supabase
    .from("tbl_plan_previsionnel_formations")
    .select(`
      *,
      collaborateur:collaborateurs!tbl_plan_previsionnel_formations_collaborateur_id_fkey(id, nom, prenom, email, site_id),
      catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie, duree_heures, periodicite_validite_mois, cout_unitaire)
    `)
    .in("periode_annee", [currentYear, nextYear])
    .order("periode_annee", { ascending: false })
    .order("periode_trimestre", { ascending: true });

  if (error) {
    console.error("Erreur récupération plan prévisionnel:", error);
  }

  // Récupérer les collaborateurs pour le formulaire
  const { data: collaborateurs } = await supabase
    .from("collaborateurs")
    .select("id, nom, prenom, email")
    .eq("statut", "actif")
    .order("nom", { ascending: true });

  // Récupérer le catalogue pour le formulaire
  const { data: catalogue } = await supabase
    .from("tbl_catalogue_formations")
    .select("id, nom, code_interne, categorie, cout_unitaire")
    .eq("is_active", true)
    .order("nom", { ascending: true });

  // Récupérer les sites pour les filtres
  const { data: sites } = await supabase
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  return (
    <PlanPrevisionnelClient
      initialPlan={planPrevisionnel || []}
      collaborateurs={collaborateurs || []}
      catalogue={catalogue || []}
      sites={sites || []}
      hasRHAccess={hasRHAccess}
      currentYear={currentYear}
      nextYear={nextYear}
    />
  );
}

