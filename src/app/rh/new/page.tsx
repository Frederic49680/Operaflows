import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import CreateCollaborateurClient from "./create-collaborateur-client";

export default async function CreateCollaborateurPage() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier les droits RH/Admin
  const hasRHAccess = await isRHOrAdmin(user.id);
  if (!hasRHAccess) {
    redirect("/unauthorized");
  }

  // Récupérer les responsables, utilisateurs et sites disponibles pour le formulaire
  const [responsables, users, sitesResult] = await Promise.all([
    supabase
      .from("collaborateurs")
      .select("id, nom, prenom")
      .eq("statut", "actif")
      .order("nom", { ascending: true }),
    supabase
      .from("tbl_users")
      .select("id, email")
      .eq("statut", "actif")
      .is("collaborateur_id", null)
      .order("email", { ascending: true }),
    supabase
      .from("tbl_sites")
      .select("site_id, site_code, site_label")
      .eq("is_active", true)
      .order("site_code", { ascending: true }),
  ]);

  // Logs de debug pour les sites
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 DEBUG Create Collab - Sites récupérés:", sitesResult.data?.length || 0);
    if (sitesResult.error) {
      console.error("❌ Erreur récupération sites:", sitesResult.error);
      console.error("Code:", sitesResult.error.code);
      console.error("Message:", sitesResult.error.message);
      console.error("Details:", sitesResult.error.details);
      console.error("Hint:", sitesResult.error.hint);
    }
  }

  const sites = sitesResult.data || [];

  return (
    <CreateCollaborateurClient
      responsables={responsables.data || []}
      availableUsers={users.data || []}
      sites={sites.data || []}
    />
  );
}

