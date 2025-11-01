import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
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

  // Utiliser le service role key pour bypasser RLS si disponible
  // Cela permet de récupérer tous les utilisateurs même si les politiques RLS sont restrictives
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

  const clientToUse = supabaseAdmin || supabase;

  // Récupérer les responsables, utilisateurs et sites disponibles pour le formulaire
  const [responsables, users, sitesResult] = await Promise.all([
    supabase
      .from("collaborateurs")
      .select("id, nom, prenom")
      .eq("statut", "actif")
      .order("nom", { ascending: true }),
    clientToUse
      .from("tbl_users")
      .select("id, email, statut, collaborateur_id")
      .eq("statut", "actif")
      .is("collaborateur_id", null)
      .order("email", { ascending: true }),
    supabase
      .from("tbl_sites")
      .select("site_id, site_code, site_label")
      .eq("is_active", true)
      .order("site_code", { ascending: true }),
  ]);

  // Logs de debug en développement
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 DEBUG Create Collab - Sites récupérés:", sitesResult.data?.length || 0);
    if (sitesResult.error) {
      console.error("❌ Erreur récupération sites:", sitesResult.error);
      console.error("Code:", sitesResult.error.code);
      console.error("Message:", sitesResult.error.message);
      console.error("Details:", sitesResult.error.details);
      console.error("Hint:", sitesResult.error.hint);
    }
    
    console.log("🔍 DEBUG Create Collab - Utilisateurs récupérés:", users.data?.length || 0);
    if (users.error) {
      console.error("❌ Erreur récupération utilisateurs:", users.error);
      console.error("Code:", users.error.code);
      console.error("Message:", users.error.message);
      console.error("Details:", users.error.details);
      console.error("Hint:", users.error.hint);
    } else if (users.data) {
      console.log("🔍 DEBUG Create Collab - Liste des utilisateurs:", users.data.map(u => ({ id: u.id, email: u.email, statut: u.statut, collaborateur_id: u.collaborateur_id })));
    }
  }

  const sites = sitesResult.data || [];

  return (
    <CreateCollaborateurClient
      responsables={responsables.data || []}
      availableUsers={users.data || []}
      sites={sites}
    />
  );
}

