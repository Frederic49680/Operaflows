import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import AffaireDetailClient from "./affaire-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AffaireDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Récupérer l'affaire avec toutes ses données
  const { data: affaire, error } = await clientToUse
    .from("tbl_affaires")
    .select(`
      *,
      charge_affaires:collaborateurs!tbl_affaires_charge_affaires_id_fkey(id, nom, prenom),
      site:tbl_sites!tbl_affaires_site_id_fkey(site_id, site_code, site_label),
      bpu:tbl_affaires_bpu(*),
      depenses:tbl_affaires_depenses(*),
      pre_planif:tbl_affaires_pre_planif(*),
      documents:tbl_affaires_documents(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !affaire) {
    console.error("Erreur récupération affaire:", error);
    notFound();
  }

  // Récupérer les sites et collaborateurs pour la modification
  const { data: sites } = await clientToUse
    .from("tbl_sites")
    .select("site_id, site_code, site_label")
    .eq("is_active", true)
    .order("site_code", { ascending: true });

  const { data: collaborateurs } = await clientToUse
    .from("collaborateurs")
    .select("id, nom, prenom")
    .eq("statut", "actif")
    .order("nom", { ascending: true });

  return (
    <AffaireDetailClient
      affaire={affaire}
      sites={sites || []}
      collaborateurs={collaborateurs || []}
    />
  );
}

