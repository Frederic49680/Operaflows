import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import AffairesClient from "./affaires-client";

export default async function AffairesPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Utiliser le service role key pour bypasser RLS
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

  // Récupérer les affaires
  const { data: affaires, error } = await clientToUse
    .from("tbl_affaires")
    .select(`
      *,
      charge_affaires:collaborateurs!tbl_affaires_charge_affaires_id_fkey(id, nom, prenom),
      site:tbl_sites!tbl_affaires_site_id_fkey(site_id, site_code, site_label)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération affaires:", error);
  }

  // Récupérer les sites pour les filtres
  const { data: sites } = await clientToUse
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  // Récupérer les collaborateurs pour le formulaire
  const { data: collaborateurs } = await clientToUse
    .from("collaborateurs")
    .select("id, nom, prenom")
    .eq("statut", "actif")
    .order("nom", { ascending: true });

  return (
    <AffairesClient
      initialAffaires={affaires || []}
      sites={sites || []}
      collaborateurs={collaborateurs || []}
    />
  );
}
