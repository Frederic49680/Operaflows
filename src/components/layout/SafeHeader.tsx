import { createServerClient } from "@/lib/supabase/server";
import HeaderClient from "./HeaderClient";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

/**
 * Wrapper sécurisé pour Header qui gère les erreurs
 */
export default async function SafeHeader() {
  try {
    const supabase = await createServerClient();

    // Vérifier la session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null; // Pas de header si non connecté
    }

    // Récupérer les informations utilisateur (gérer les erreurs gracieusement)
    const { data: userData } = await supabase
      .from("tbl_users")
      .select(`
        *,
        collaborateurs(nom, prenom)
      `)
      .eq("id", user.id)
      .maybeSingle();
    
    // Ignorer les erreurs silencieusement (utilisateur peut ne pas être dans tbl_users)

    // Récupérer les rôles de l'utilisateur
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name, description)")
      .eq("user_id", user.id)
      .catch(() => ({ data: [] })); // Fallback si erreur

    // Extraire les rôles
    const roles = (userRoles?.data || userRoles || [])
      .map((ur: any) => {
        const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
        return role;
      })
      .filter(Boolean);

    // Vérifier les permissions (avec gestion d'erreur)
    let isAdmin = false;
    let hasRHAccess = false;
    
    try {
      isAdmin = roles.some((r: any) => {
        const role = Array.isArray(r) ? r[0] : r;
        return role?.name === "Administrateur";
      });
    } catch (e) {
      // Ignorer l'erreur
    }

    try {
      const { isRHOrAdmin } = await import("@/lib/auth/rh-check");
      hasRHAccess = await isRHOrAdmin(user.id).catch(() => false);
    } catch (e) {
      // Ignorer l'erreur, hasRHAccess reste false
    }

    // Nom d'affichage (gérer les cas où collaborateurs peut être null ou un tableau)
    let displayName = userData?.email || user.email || "Utilisateur";
    if (userData?.collaborateurs) {
      const collab = Array.isArray(userData.collaborateurs) 
        ? userData.collaborateurs[0] 
        : userData.collaborateurs;
      if (collab && typeof collab === 'object' && 'prenom' in collab && 'nom' in collab) {
        displayName = `${collab.prenom} ${collab.nom}`;
      }
    }

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
        visible: true,
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
  } catch (error) {
    // En cas d'erreur, ne pas afficher le header plutôt que de crasher
    console.error("Erreur dans SafeHeader:", error);
    return null;
  }
}

