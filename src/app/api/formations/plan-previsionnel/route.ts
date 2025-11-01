import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste du plan prévisionnel
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
    const annee = searchParams.get("annee");
    const collaborateurId = searchParams.get("collaborateur_id");
    const statut = searchParams.get("statut_validation");

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("tbl_plan_previsionnel_formations")
      .select(`
        *,
        collaborateur:collaborateurs!tbl_plan_previsionnel_formations_collaborateur_id_fkey(id, nom, prenom, email),
        catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie, duree_heures, periodicite_validite_mois, cout_unitaire)
      `);

    // Si pas RH, voir seulement ses propres demandes ou celles pour lesquelles il est collaborateur
    if (!hasRHAccess) {
      const { data: collab } = await supabase
        .from("collaborateurs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (collab) {
        query = query.or(`demandeur_id.eq.${user.id},collaborateur_id.eq.${collab.id}`);
      } else {
        query = query.eq("demandeur_id", user.id);
      }
    }

    if (annee) query = query.eq("periode_annee", parseInt(annee));
    if (collaborateurId) query = query.eq("collaborateur_id", collaborateurId);
    if (statut) query = query.eq("statut_validation", statut);

    const { data, error } = await query.order("periode_annee", { ascending: false })
      .order("periode_trimestre", { ascending: true })
      .order("date_cible", { ascending: true });

    if (error) {
      console.error("Erreur récupération plan prévisionnel:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erreur GET plan prévisionnel:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une demande dans le plan prévisionnel
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    // Vérifier si l'utilisateur peut créer pour ce collaborateur
    const hasRHAccess = await isRHOrAdmin(user.id);
    let canCreate = hasRHAccess;

    if (!canCreate) {
      // Vérifier si c'est pour lui-même
      const { data: collab } = await supabase
        .from("collaborateurs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      canCreate = collab?.id === body.collaborateur_id;
    }

    if (!canCreate) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("tbl_plan_previsionnel_formations")
      .insert({
        ...body,
        demandeur_id: user.id,
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        *,
        collaborateur:collaborateurs!tbl_plan_previsionnel_formations_collaborateur_id_fkey(id, nom, prenom, email),
        catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie)
      `)
      .single();

    if (error) {
      console.error("Erreur création plan prévisionnel:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST plan prévisionnel:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

