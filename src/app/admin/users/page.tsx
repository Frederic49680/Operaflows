import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
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

  // Récupérer les utilisateurs avec leurs rôles via user_roles
  const { data: users } = await supabase
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

  // Récupérer les demandes en attente
  // Utiliser le client admin pour bypasser RLS temporairement si nécessaire
  const { data: pendingRequests, error: requestsError } = await supabase
    .from("tbl_user_requests")
    .select("*")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: false });

  // Debug: Afficher l'erreur et les données pour diagnostic
  if (requestsError) {
    console.error("Erreur récupération demandes:", requestsError);
  }
  
  // Debug: Vérifier ce qui est retourné
  console.log("Pending requests count:", pendingRequests?.length || 0);
  if (pendingRequests && pendingRequests.length > 0) {
    console.log("First request:", pendingRequests[0]);
  }

  // Récupérer tous les rôles pour le formulaire d'attribution
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  return (
    <UsersManagementClient
      users={users || []}
      pendingRequests={pendingRequests || []}
      roles={roles || []}
    />
  );
}

