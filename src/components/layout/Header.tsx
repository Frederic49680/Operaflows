import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import HeaderClient from "./HeaderClient";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

export default async function Header() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Pas de header si non connecté
  }

  // Récupérer les informations utilisateur
  const { data: userData } = await supabase
    .from("tbl_users")
    .select(`
      *,
      collaborateurs(nom, prenom)
    `)
    .eq("id", user.id)
    .maybeSingle();

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name, description)")
    .eq("user_id", user.id);

  // Extraire les rôles
  const roles = userRoles?.map((ur) => {
    const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
    return role;
  }).filter(Boolean) || [];

  // Vérifier les permissions
  const isAdmin = roles.some((r) => {
    const role = Array.isArray(r) ? r[0] : r;
    return role?.name === "Administrateur";
  });
  const hasRHAccess = await isRHOrAdmin(user.id);

  // Nom d'affichage
  const collaborateurs = userData?.collaborateurs;
  const displayName = collaborateurs && typeof collaborateurs === 'object' && !Array.isArray(collaborateurs) && 'prenom' in collaborateurs && 'nom' in collaborateurs
    ? `${collaborateurs.prenom} ${collaborateurs.nom}`
    : userData?.email || user.email || "Utilisateur";

  // Construction du menu selon les rôles
  const menuItems = [
    {
      label: "Tableau de bord",
      href: "/dashboard",
      icon: LayoutDashboard,
      alwaysVisible: true,
    },
    {
      label: "RH Collaborateurs",
      href: "/rh",
      icon: Users,
      visible: true, // Tous les utilisateurs peuvent voir leur fiche
      badge: hasRHAccess ? undefined : undefined,
    },
    {
      label: "Affaires",
      href: "/affaires",
      icon: Briefcase,
      visible: true,
      comingSoon: true,
    },
    {
      label: "Planification",
      href: "/planification",
      icon: Calendar,
      visible: true,
      comingSoon: true,
    },
    {
      label: "KPI & Alertes",
      href: "/kpi",
      icon: BarChart3,
      visible: true,
      comingSoon: true,
    },
  ];

  // Menu admin
  const adminItems = isAdmin
    ? [
        {
          label: "Administration",
          icon: Settings,
          submenu: [
            {
              label: "Utilisateurs",
              href: "/admin/users",
            },
            {
              label: "Rôles",
              href: "/admin/roles",
            },
            {
              label: "Journal d'audit",
              href: "/admin/audit",
            },
          ],
        },
      ]
    : [];

  return (
    <HeaderClient
      user={{
        id: user.id,
        email: user.email || "",
        displayName,
        avatar: null,
      }}
      menuItems={menuItems}
      adminItems={adminItems}
      isAdmin={isAdmin}
    />
  );
}

