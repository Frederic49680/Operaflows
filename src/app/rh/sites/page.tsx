import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import SitesManagementClient from "./sites-management-client";

export default async function SitesPage() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier les droits RH/Admin
  const hasRHAccess = await isRHOrAdmin(user.id);
  if (!hasRHAccess) {
    redirect("/unauthorized");
  }

  // Récupérer les sites avec leurs responsables (inclure tous les sites, actifs et inactifs pour l'affichage)
  const { data: sites, error: sitesError } = await supabase
    .from("tbl_sites")
    .select(`
      *,
      responsables:tbl_site_responsables!tbl_site_responsables_site_id_fkey(
        *,
        collaborateur:collaborateurs!tbl_site_responsables_collaborateur_id_fkey(
          id, nom, prenom, email
        )
      )
    `)
    .order("site_code", { ascending: true });

  if (sitesError) {
    console.error("Erreur récupération sites:", sitesError);
  }

  // Formater les données pour le client
  const sitesWithResponsables = (sites || []).map((site) => ({
    ...site,
    responsables_actifs: (site.responsables || [])
      .filter((r: { is_active: boolean; date_fin: string | null }) => 
        r.is_active && (!r.date_fin || new Date(r.date_fin) >= new Date())
      )
      .map((r: { collaborateur_id: string; role_fonctionnel: string; date_debut: string; date_fin: string | null; collaborateur: { nom: string; prenom: string } }) => ({
        collaborateur_id: r.collaborateur_id,
        role_fonctionnel: r.role_fonctionnel,
        date_debut: r.date_debut,
        date_fin: r.date_fin,
        collaborateur: r.collaborateur,
      })),
  }));

  return <SitesManagementClient sites={sitesWithResponsables} />;
}

