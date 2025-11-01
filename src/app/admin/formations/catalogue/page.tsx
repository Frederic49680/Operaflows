import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import CatalogueFormationsClient from "./catalogue-formations-client";

export default async function CatalogueFormationsPage() {
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

  // Récupérer le catalogue des formations
  const { data: catalogue, error } = await supabase
    .from("tbl_catalogue_formations")
    .select(`
      *,
      competences:tbl_catalogue_formations_competences(
        competence:competences(id, libelle, code)
      )
    `)
    .order("nom", { ascending: true });

  if (error) {
    console.error("Erreur récupération catalogue:", error);
  }

  // Formater les compétences
  const formatted = (catalogue || []).map((item: {
    competences?: Array<{ competence?: { id: string; libelle: string; code?: string | null } }>;
    [key: string]: unknown;
  }) => ({
    ...item,
    competences: (item.competences || []).map((c) => c.competence).filter(Boolean),
  }));

  // Récupérer les compétences disponibles pour les associer
  const { data: competences } = await supabase
    .from("competences")
    .select("id, libelle, code")
    .order("libelle", { ascending: true });

  return (
    <CatalogueFormationsClient
      initialCatalogue={formatted}
      availableCompetences={competences || []}
    />
  );
}

