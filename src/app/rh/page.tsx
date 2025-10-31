import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
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

  // Récupérer les collaborateurs
  let collaborateurs = [];
  if (hasRHAccess) {
    // RH/Admin voient tous les collaborateurs
    const { data } = await supabase
      .from("collaborateurs")
      .select(`
        *,
        responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom),
        user:user_id(id, email)
      `)
      .order("nom", { ascending: true });
    collaborateurs = data || [];
  } else {
    // Les autres voient seulement leur propre fiche
    const { data: collabData } = await supabase
      .from("collaborateurs")
      .select(`
        *,
        responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom),
        user:user_id(id, email)
      `)
      .eq("user_id", user.id)
      .maybeSingle();
    
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
