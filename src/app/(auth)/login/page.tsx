"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClientSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Vérifier le statut de l'utilisateur dans tbl_users
        const { data: userData, error: userError } = await supabase
          .from("tbl_users")
          .select("statut, password_expires_at")
          .eq("id", data.user.id)
          .single();

        if (userError || !userData) {
          setError("Compte utilisateur non trouvé. Contactez un administrateur.");
          setLoading(false);
          return;
        }

        // Vérifier si le compte est actif
        if (userData.statut !== "actif") {
          setError(
            userData.statut === "en_attente"
              ? "Votre compte est en attente de validation par un administrateur."
              : "Votre compte a été suspendu ou désactivé."
          );
          setLoading(false);
          return;
        }

        // Vérifier si le mot de passe provisoire a expiré
        if (userData.password_expires_at) {
          const expiresAt = new Date(userData.password_expires_at);
          if (expiresAt < new Date()) {
            setError(
              "Votre mot de passe provisoire a expiré. Veuillez demander une réinitialisation."
            );
            setLoading(false);
            return;
          }
        }

        // Mettre à jour la dernière connexion (optionnel, ne pas bloquer si erreur)
        if (data.session?.access_token) {
          try {
            // Utiliser le hash du token pour éviter les problèmes de longueur (temporaire)
            // En attendant la migration qui changera session_token en TEXT
            const tokenHash = data.session.access_token.substring(0, 255);
            
            const { error: sessionError } = await supabase
              .from("tbl_sessions")
              .insert({
                user_id: data.user.id,
                session_token: tokenHash,
                ip_address: null,
                user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
                date_debut: new Date().toISOString(),
                statut: "active",
              });
            
            if (sessionError) {
              // Ignorer les erreurs de session (ne pas bloquer la connexion)
              console.error("Erreur création session:", sessionError);
            }
          } catch (err) {
            // Ignorer les erreurs de session (ne pas bloquer la connexion)
            console.error("Erreur création session:", err);
          }
        }

        // Rediriger vers le tableau de bord
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary">
            Connexion à OperaFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Application de suivi, planification et pilotage d'activités
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="card space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                Adresse email professionnelle
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900"
                placeholder="prenom.nom@snef.fr"
                style={{ 
                  pointerEvents: loading ? 'none' : 'auto',
                  zIndex: 1,
                  position: 'relative'
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900"
                placeholder="••••••••"
                style={{ 
                  pointerEvents: loading ? 'none' : 'auto',
                  zIndex: 1,
                  position: 'relative'
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:text-primary-dark"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Besoin d&apos;un compte ?{" "}
              <Link href="/request-access" className="font-medium text-primary hover:text-primary-dark">
                Demander un accès
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

