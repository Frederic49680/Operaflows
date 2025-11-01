import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import FonctionsMetierClient from "./fonctions-metier-client";

export default async function FonctionsMetierPage() {
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

  // Récupérer toutes les fonctions métier (tri alphabétique)
  const { data: fonctions } = await supabase
    .from("tbl_fonctions_metier")
    .select("*")
    .order("libelle", { ascending: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Fonctions Métier
          </h1>
          <p className="text-lg text-secondary">
            Gérez le référentiel des fonctions métier disponibles pour les collaborateurs
          </p>
        </div>

        <FonctionsMetierClient fonctions={fonctions || []} />
      </div>
    </div>
  );
}

