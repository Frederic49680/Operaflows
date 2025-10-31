import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste des visites médicales
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
    const statut = searchParams.get("statut");

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("visites_medicales")
      .select(`
        *,
        collaborateur:collaborateurs!visites_medicales_collaborateur_id_fkey(id, nom, prenom, email)
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

    if (statut) query = query.eq("statut", statut);

    const { data, error } = await query.order("date_visite", { ascending: false });

    if (error) {
      console.error("Erreur récupération visites médicales:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET visites médicales:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une visite médicale
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
    const { collaborateur_id, ...visiteData } = body;

    const { data, error } = await supabase
      .from("visites_medicales")
      .insert({
        collaborateur_id,
        ...visiteData,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création visite médicale:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST visite médicale:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

