import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste du catalogue des formations
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
    const categorie = searchParams.get("categorie");
    const type = searchParams.get("type");
    const activeOnly = searchParams.get("active_only") !== "false";

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("tbl_catalogue_formations")
      .select(`
        *,
        competences:tbl_catalogue_formations_competences(
          competence:competences(id, libelle, code)
        )
      `);

    // Seuls les RH/Admin voient les formations inactives
    if (activeOnly || !hasRHAccess) {
      query = query.eq("is_active", true);
    }

    if (categorie) query = query.eq("categorie", categorie);
    if (type) query = query.eq("type_formation", type);

    const { data, error } = await query.order("nom", { ascending: true });

    if (error) {
      console.error("Erreur récupération catalogue:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    // Formater les compétences
    const formatted = (data || []).map((item) => ({
      ...item,
      competences: (item.competences || []).map((c: any) => c.competence).filter(Boolean),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET catalogue:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une formation dans le catalogue
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
    const { competences, ...formationData } = body;

    // Créer la formation
    const { data: formation, error: insertError } = await supabase
      .from("tbl_catalogue_formations")
      .insert({
        ...formationData,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur création formation:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // Associer les compétences si fournies
    if (formation && competences && Array.isArray(competences) && competences.length > 0) {
      const competencesData = competences.map((compId: string) => ({
        catalogue_formation_id: formation.id,
        competence_id: compId,
      }));

      const { error: compError } = await supabase
        .from("tbl_catalogue_formations_competences")
        .insert(competencesData);

      if (compError) {
        console.error("Erreur association compétences:", compError);
        // Ne pas faire échouer la création si l'association échoue
      }
    }

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    console.error("Erreur POST catalogue:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

