import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste des collaborateurs
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    const searchParams = new URL(request.url).searchParams;
    const site = searchParams.get("site");
    const statut = searchParams.get("statut");

    let query = supabase
      .from("collaborateurs")
      .select(`
        *,
        responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom, email),
        user:user_id(id, email)
      `);

    if (!hasRHAccess) {
      // Les non-RH voient seulement leur propre fiche
      query = query.eq("user_id", user.id);
    } else {
      // RH/Admin peuvent filtrer
      if (site) query = query.eq("site", site);
      if (statut) query = query.eq("statut", statut);
    }

    const { data, error } = await query.order("nom", { ascending: true });

    if (error) {
      console.error("Erreur récupération collaborateurs:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET collaborateurs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un collaborateur
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

    const { data, error } = await supabase
      .from("collaborateurs")
      .insert({
        ...body,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création collaborateur:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST collaborateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

