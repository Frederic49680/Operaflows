import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import RolesManagementClient from "./roles-management-client";

export default async function RolesManagementPage() {
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

  // Récupérer tous les rôles
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  // Récupérer les permissions pour chaque rôle
  const { data: permissions } = await supabase
    .from("tbl_permissions")
    .select("*, roles(name)")
    .order("module, action");

  return (
    <RolesManagementClient
      roles={roles || []}
      permissions={permissions || []}
    />
  );
}

