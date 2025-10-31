import { createServerClient } from "@/lib/supabase/server";

export interface AuditLogData {
  action: string;
  type_entite?: string;
  entite_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Enregistre une action dans le journal d'audit
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("tbl_audit_log").insert({
    user_id: user?.id || null,
    action: data.action,
    type_entite: data.type_entite || null,
    entite_id: data.entite_id || null,
    details: data.details || null,
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
  });
}

/**
 * Actions d'audit courantes
 */
export const AuditActions = {
  // Connexions
  LOGIN: "connexion",
  LOGOUT: "deconnexion",
  
  // Gestion utilisateurs
  USER_CREATED: "creation_compte",
  USER_UPDATED: "modification_compte",
  USER_DELETED: "suppression_compte",
  USER_ACTIVATED: "activation_compte",
  USER_SUSPENDED: "suspension_compte",
  
  // Rôles
  ROLE_ASSIGNED: "attribution_role",
  ROLE_REMOVED: "suppression_role",
  
  // Demandes
  REQUEST_CREATED: "creation_demande",
  REQUEST_ACCEPTED: "acceptation_demande",
  REQUEST_REJECTED: "refus_demande",
  
  // Permissions
  PERMISSION_GRANTED: "attribution_permission",
  PERMISSION_REVOKED: "revocation_permission",
} as const;

