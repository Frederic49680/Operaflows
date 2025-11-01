import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import CatalogueAbsencesClient from "./catalogue-absences-client";

export default async function AdminAbsencesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasRHAccess = await isRHOrAdmin(user.id);
  if (!hasRHAccess) {
    redirect("/unauthorized");
  }

  // Récupérer le catalogue des absences
  const { data: catalogue, error } = await supabase
    .from("catalogue_absences")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("Erreur récupération catalogue:", error);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Gestion du Catalogue des Absences
          </h1>
          <p className="text-lg text-secondary">
          Référentiel des types d&apos;absences reconnus dans l&apos;entreprise
        </p>
      </div>

      <CatalogueAbsencesClient initialCatalogue={catalogue || []} />
      </div>
    </div>
  );
}

