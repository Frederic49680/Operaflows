"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RequestAccessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClientSupabase();

      // Vérifier si l'email est déjà utilisé
      const { data: existingUser } = await supabase
        .from("tbl_user_requests")
        .select("id, statut")
        .eq("email", formData.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingUser) {
        if (existingUser.statut === "en_attente") {
          setError("Une demande est déjà en attente pour cet email.");
          setLoading(false);
          return;
        }
      }

      // Créer la demande
      const { data: currentUser } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from("tbl_user_requests")
        .insert({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          demandeur_id: currentUser?.user?.id || null,
          statut: "en_attente",
        });

      if (insertError) {
        setError("Erreur lors de la création de la demande. Veuillez réessayer.");
        console.error(insertError);
        setLoading(false);
        return;
      }

      // TODO: Envoyer notification email à l'admin via SendGrid

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-2">
              Demande envoyée avec succès
            </h2>
            <p className="text-gray-600 mb-4">
              Votre demande d&apos;accès a été transmise à un administrateur.
              Vous recevrez un email une fois votre compte validé.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary">
            Demande d&apos;accès
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Formulaire de demande de création de compte OperaFlow
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-secondary mb-1">
                Nom *
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Dupont"
              />
            </div>

            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-secondary mb-1">
                Prénom *
              </label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Jean"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                Adresse email professionnelle *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="jean.dupont@snef.fr"
              />
              <p className="mt-1 text-xs text-gray-500">
                Utilisez votre adresse email professionnelle
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>

            <div className="text-sm text-gray-600 text-center">
              <p>
                Déjà un compte ?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

