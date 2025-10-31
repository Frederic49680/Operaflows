import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer les informations utilisateur
  const { data: userData } = await supabase
    .from("tbl_users")
    .select("*, roles(name, description), collaborateurs(*)")
    .eq("id", user.id)
    .single();

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name, description), site_id")
    .eq("user_id", user.id);

  // Vérifier si l'utilisateur est admin (pour modifier les rôles)
  const isAdmin = userRoles?.some((ur) => ur.roles?.name === "Administrateur");

  // Vérifier si l'utilisateur est RH (pour modifier le profil RH)
  const isRH = userRoles?.some((ur) => ur.roles?.name === "Administratif RH");

  return (
    <ProfileClient
      user={user}
      userData={userData}
      userRoles={userRoles || []}
      isAdmin={isAdmin}
      isRH={isRH}
    />
  );
}

