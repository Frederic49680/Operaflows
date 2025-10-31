import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste des relevés dosimétriques
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const collaborateurId = searchParams.get("collaborateur_id");

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("dosimetrie")
      .select(`
        *,
        collaborateur:collaborateurs!dosimetrie_collaborateur_id_fkey(id, nom, prenom, email)
      `);

    if (!hasRHAccess && !collaborateurId) {
      const { data: collab } = await supabase
        .from("collaborateurs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (collab) {
        query = query.eq("collaborateur_id", collab.id);
      } else {
        return NextResponse.json([]);
      }
    } else if (collaborateurId) {
      query = query.eq("collaborateur_id", collaborateurId);
    }

    const { data, error } = await query.order("periode_debut", { ascending: false });

    if (error) {
      console.error("Erreur récupération dosimétrie:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET dosimétrie:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un relevé dosimétrique
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    if (!hasRHAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { collaborateur_id, ...dosimetrieData } = body;

    const { data, error } = await supabase
      .from("dosimetrie")
      .insert({
        collaborateur_id,
        ...dosimetrieData,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création dosimétrie:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST dosimétrie:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

