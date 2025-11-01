import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import RHPageClient from "./rh-client";

export default async function RHPage() {
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
  
  // Tous les utilisateurs authentifiés peuvent accéder pour voir leur propre fiche
  // Mais seuls RH/Admin voient la liste complète

  // Utiliser le service role key pour bypasser RLS si disponible (comme pour la page admin)
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

  // Récupérer les collaborateurs avec le site joint
  let collaborateurs = [];
  if (hasRHAccess) {
    // RH/Admin voient tous les collaborateurs
    const { data, error } = await clientToUse
      .from("collaborateurs")
      .select(`
        *,
        responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom),
        user:user_id(id, email),
        site_detail:tbl_sites!collaborateurs_site_id_fkey(site_code, site_label)
      `)
      .order("nom", { ascending: true });
    
    // Log de debug en développement
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG RH Page - Collaborateurs récupérés:", data?.length || 0);
      if (error) {
        console.error("❌ Erreur récupération collaborateurs:", error);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
      }
    }
    
    collaborateurs = data || [];
  } else {
    // Les autres voient seulement leur propre fiche
    const { data: collabData, error } = await supabase
      .from("collaborateurs")
      .select(`
        *,
        responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom),
        user:user_id(id, email),
        site_detail:tbl_sites!collaborateurs_site_id_fkey(site_code, site_label)
      `)
      .eq("user_id", user.id)
      .maybeSingle();
    
    // Log de debug en développement
    if (process.env.NODE_ENV === "development" && error) {
      console.error("❌ Erreur récupération collaborateur:", error);
    }
    
    if (collabData) {
      collaborateurs = [collabData];
    }
  }

  // Récupérer les alertes d'échéances si RH/Admin
  let alertes = [];
  if (hasRHAccess) {
    const { data: alertesData } = await supabase
      .from("v_alertes_echeances")
      .select("*")
      .limit(20)
      .order("jours_restants", { ascending: true });
    alertes = alertesData || [];
  }

  return (
    <RHPageClient
      collaborateurs={collaborateurs}
      alertes={alertes}
      hasRHAccess={hasRHAccess}
    />
  );
}
