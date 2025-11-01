import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import SuiviFormationsClient from "./suivi-formations-client";

export default async function SuiviFormationsPage() {
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

  // Récupérer les alertes
  const { data: alertes } = await supabase
    .from("v_alertes_formations")
    .select("*")
    .order("date_echeance_validite", { ascending: true })
    .limit(50);

  // Récupérer les sites pour les filtres
  const { data: sites } = await supabase
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  return (
    <SuiviFormationsClient
      initialAlertes={alertes || []}
      sites={sites || []}
    />
  );
}

