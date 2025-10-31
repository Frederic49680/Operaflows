import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function PlanificationPage() {
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Planification
          </h1>
          <p className="text-lg text-secondary">
            Planification et suivi des activités
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-secondary mb-2">
              Module en cours de développement
            </h2>
            <p className="text-gray-600 mb-6">
              Ce module sera disponible prochainement
            </p>
            <a
              href="/dashboard"
              className="btn-primary inline-block"
            >
              Retour au tableau de bord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

