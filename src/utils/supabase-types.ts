/**
 * Utilitaires pour gérer les types Supabase avec jointures
 * Supabase retourne parfois les jointures comme des tableaux
 */

export function extractRole<T extends { name: string; description?: string | null }>(
  roles: T[] | T | null | undefined
): T | null {
  if (!roles) return null;
  if (Array.isArray(roles)) {
    return roles.length > 0 ? roles[0] : null;
  }
  return roles;
}

export function extractRoles<T extends { name: string; description?: string | null }>(
  rolesArray: Array<{ roles: T[] | T | null }> | undefined
): T[] {
  if (!rolesArray) return [];
  return rolesArray
    .map((item) => {
      const role = extractRole(item.roles);
      return role;
    })
    .filter((r): r is T => r !== null);
}

