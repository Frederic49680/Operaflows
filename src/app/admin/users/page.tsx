import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import UsersManagementClient from "./users-management-client";

export default async function UsersManagementPage() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  const isAdmin = userRoles?.some((ur) => {
    const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
    return role?.name === "Administrateur";
  });
  if (!isAdmin) {
    redirect("/unauthorized");
  }

  // Utiliser le service role key pour bypasser RLS et récupérer tous les utilisateurs
  // Car les politiques RLS peuvent bloquer les jointures complexes
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

  // Récupérer les utilisateurs avec leurs rôles via user_roles
  // Utiliser le client admin si disponible pour bypasser RLS
  const clientToUse = supabaseAdmin || supabase;
  
  // Essayer d'abord avec les relations
  let { data: users, error: usersError } = await clientToUse
    .from("tbl_users")
    .select(`
      *,
      user_roles(
        roles(name, description),
        site_id
      ),
      collaborateurs(nom, prenom)
    `)
    .order("created_at", { ascending: false });

  // Si erreur de jointure, essayer sans relations pour voir si c'est un problème RLS
  if (usersError || !users || users.length === 0) {
    console.log("⚠️ Tentative sans relations:", usersError);
    const { data: usersSimple, error: usersSimpleError } = await clientToUse
      .from("tbl_users")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!usersSimpleError && usersSimple) {
      // Si on récupère les données sans relations, c'est un problème de jointure
      users = usersSimple.map((u: any) => ({ ...u, user_roles: [], collaborateurs: null }));
      console.log("✅ Utilisateurs récupérés sans relations:", users.length);
    } else {
      console.error("❌ Erreur même sans relations:", usersSimpleError);
    }
  }

  // Log pour debug en développement
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 DEBUG Users:", {
      usersCount: users?.length || 0,
      usersError,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }

  if (usersError) {
    console.error("❌ Erreur récupération utilisateurs:", usersError);
  }

  // Récupérer les demandes en attente (en_attente et en_attente_validation_mail)
  // Utiliser le client admin pour bypasser RLS si disponible
  const { data: pendingRequests, error: requestsError } = await clientToUse
    .from("tbl_user_requests")
    .select("*")
    .in("statut", ["en_attente", "en_attente_validation_mail"])
    .order("created_at", { ascending: false });

  // Gestion des erreurs silencieuse (les erreurs sont déjà gérées par le composant)
  if (requestsError) {
    console.error("Erreur récupération demandes:", requestsError);
  }

  // Récupérer tous les rôles pour le formulaire d'attribution
  const { data: roles } = await clientToUse
    .from("roles")
    .select("*")
    .order("name");

  // Récupérer tous les sites actifs pour le formulaire d'attribution
  const { data: sites } = await clientToUse
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  // S'assurer que les données sont bien passées
  const pendingRequestsArray = Array.isArray(pendingRequests) ? pendingRequests : [];
  
  return (
    <UsersManagementClient
      users={users || []}
      pendingRequests={pendingRequestsArray}
      roles={roles || []}
      sites={sites || []}
    />
  );
}

