import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { RoleName } from "@/types/auth";

/**
 * Middleware pour vérifier les rôles et permissions
 * Utilisé pour protéger les routes selon les rôles applicatifs
 */
export async function withRole(
  request: NextRequest,
  allowedRoles: RoleName[],
  options?: {
    redirectTo?: string;
    requireAll?: boolean; // Si true, l'utilisateur doit avoir TOUS les rôles
  }
): Promise<NextResponse> {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(
      new URL("/login?redirect=" + encodeURIComponent(request.url), request.url)
    );
  }

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  if (rolesError || !userRoles || userRoles.length === 0) {
    // Pas de rôle attribué
    return NextResponse.redirect(
      new URL("/unauthorized", request.url)
    );
  }

  // Extraire les noms de rôles
  const userRoleNames = userRoles
    .map((ur) => {
      const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return role?.name;
    })
    .filter((name): name is RoleName => name !== undefined);

  // Vérifier les permissions
  if (options?.requireAll) {
    // L'utilisateur doit avoir TOUS les rôles demandés
    const hasAllRoles = allowedRoles.every((role) =>
      userRoleNames.includes(role)
    );
    if (!hasAllRoles) {
      return NextResponse.redirect(
        new URL(options.redirectTo || "/unauthorized", request.url)
      );
    }
  } else {
    // L'utilisateur doit avoir AU MOINS UN des rôles demandés
    const hasAnyRole = allowedRoles.some((role) =>
      userRoleNames.includes(role)
    );
    if (!hasAnyRole) {
      return NextResponse.redirect(
        new URL(options?.redirectTo || "/unauthorized", request.url)
      );
    }
  }

  // Créer les headers avec les informations utilisateur
  const response = NextResponse.next();
  response.headers.set("x-user-id", user.id);
  response.headers.set(
    "x-user-roles",
    JSON.stringify(userRoleNames)
  );

  return response;
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export async function hasPermission(
  userId: string,
  module: string,
  action: string,
  resourcePath?: string
): Promise<boolean> {
  const supabase = await createServerClient();

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const roleIds = userRoles.map((ur) => ur.role_id);

  // Vérifier les permissions
  const query = supabase
    .from("tbl_permissions")
    .select("id")
    .in("role_id", roleIds)
    .eq("module", module)
    .eq("action", action);

  if (resourcePath) {
    query.or(`resource_path.is.null,resource_path.eq.${resourcePath}`);
  } else {
    query.is("resource_path", null);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return false;
  }

  return true;
}

/**
 * Récupère les rôles d'un utilisateur
 */
export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const supabase = await createServerClient();

  const { data: userRoles, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error || !userRoles) {
    return [];
  }

  return userRoles
    .map((ur) => {
      const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return role?.name;
    })
    .filter((name): name is RoleName => name !== undefined);
}

/**
 * Vérifie si un utilisateur est administrateur
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes("Administrateur");
}

