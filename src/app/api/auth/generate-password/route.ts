import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Génère un mot de passe aléatoire sécurisé
 */
function generateTemporaryPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

/**
 * API Route pour générer un mot de passe provisoire
 * Utilisée uniquement par l'admin lors de la création d'un compte
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Vérifier que l'utilisateur est admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier le rôle admin (simplifié pour l'instant)
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some((ur) => ur.roles?.name === "Administrateur");
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const password = generateTemporaryPassword(16);
    
    return NextResponse.json({ password });
  } catch (error) {
    console.error("Erreur génération mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

