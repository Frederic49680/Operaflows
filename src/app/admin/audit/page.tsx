import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AuditClient from "./audit-client";

export default async function AuditPage() {
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

  // Récupérer les logs d'audit (100 derniers)
  const { data: auditLogs } = await supabase
    .from("tbl_audit_log")
    .select("*, tbl_users(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AuditClient auditLogs={auditLogs || []} />;
}

