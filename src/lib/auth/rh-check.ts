import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Vérifie si un utilisateur a les droits RH (Admin, RH, Formation, Dosimétrie)
 * Utilise le service role key si disponible pour bypasser RLS et garantir un accès fiable
 */
export async function isRHOrAdmin(userId?: string): Promise<boolean> {
  const supabase = await createServerClient();
  
  // Si userId n'est pas fourni, récupérer l'utilisateur actuel
  let currentUserId = userId;
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    currentUserId = user.id;
  }

  // Utiliser le service role key si disponible pour bypasser RLS (comme dans les pages admin)
  // Cela garantit que la vérification des rôles fonctionne même si RLS est restrictif
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

  const { data: userRoles, error } = await clientToUse
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", currentUserId);

  // Log de debug en développement
  if (process.env.NODE_ENV === "development" && error) {
    console.error("❌ Erreur vérification rôles RH:", error);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }

  if (!userRoles || userRoles.length === 0) return false;

  return userRoles.some((ur) => {
    const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
    const roleName = role?.name?.toLowerCase() || "";
    return (
      roleName === "administrateur" ||
      roleName.includes("rh") ||
      roleName.includes("formation") ||
      roleName.includes("dosimétrie") ||
      roleName.includes("dosimetrie")
    );
  });
}

/**
 * Vérifie si un utilisateur peut valider des absences (RH/Admin ou Responsable d'activité)
 */
export async function canValidateAbsences(userId?: string): Promise<boolean> {
  const supabase = await createServerClient();
  
  let currentUserId = userId;
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    currentUserId = user.id;
  }

  // Vérifier si RH/Admin
  if (await isRHOrAdmin(currentUserId)) return true;

  // Vérifier si Responsable d'activité
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", currentUserId);

  if (!userRoles || userRoles.length === 0) return false;

  return userRoles.some((ur) => {
    const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
    const roleName = role?.name?.toLowerCase() || "";
    return roleName.includes("responsable") || roleName.includes("activité");
  });
}

