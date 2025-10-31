import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste des absences
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
    const dateDebut = searchParams.get("date_debut");
    const dateFin = searchParams.get("date_fin");

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, nom, prenom, email),
        valide_par_user:valide_par(id, email)
      `);

    if (!hasRHAccess && !collaborateurId) {
      // Si pas RH et pas de filtre, voir seulement ses propres absences
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
    if (dateDebut) query = query.gte("date_debut", dateDebut);
    if (dateFin) query = query.lte("date_fin", dateFin);

    const { data, error } = await query.order("date_debut", { ascending: false });

    if (error) {
      console.error("Erreur récupération absences:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET absences:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une absence
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
    const { collaborateur_id, ...absenceData } = body;

    // Vérifier que l'utilisateur peut créer une absence pour ce collaborateur
    const { data: collab } = await supabase
      .from("collaborateurs")
      .select("user_id, responsable_id")
      .eq("id", collaborateur_id)
      .maybeSingle();

    if (!collab) {
      return NextResponse.json(
        { error: "Collaborateur introuvable" },
        { status: 404 }
      );
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    const isOwner = collab.user_id === user.id;
    
    // Vérifier si l'utilisateur est responsable de ce collaborateur
    let isResponsable = false;
    if (collab.responsable_id) {
      const { data: responsable } = await supabase
        .from("collaborateurs")
        .select("user_id")
        .eq("id", collab.responsable_id)
        .maybeSingle();
      
      isResponsable = responsable?.user_id === user.id;
    }

    if (!hasRHAccess && !isOwner && !isResponsable) {
      return NextResponse.json(
        { error: "Non autorisé à créer une absence pour ce collaborateur" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("absences")
      .insert({
        collaborateur_id,
        ...absenceData,
        created_by: user.id,
        updated_by: user.id,
        statut: absenceData.statut || "en_attente",
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création absence:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

