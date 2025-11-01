import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste du plan de formation (réel)
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
    const annee = searchParams.get("annee");

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("formations")
      .select(`
        *,
        collaborateur:collaborateurs!formations_collaborateur_id_fkey(id, nom, prenom, email, site_id),
        catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie),
        plan_previsionnel:tbl_plan_previsionnel_formations(id, periode_annee)
      `);

    // Si pas RH, voir seulement ses propres formations
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
    if (annee) {
      query = query.or(`date_debut.gte.${annee}-01-01,date_debut.lte.${annee}-12-31`);
    }

    const { data, error } = await query.order("date_debut", { ascending: false });

    if (error) {
      console.error("Erreur récupération plan formation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erreur GET plan formation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

