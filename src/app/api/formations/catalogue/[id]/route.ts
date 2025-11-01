import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Récupérer une formation du catalogue
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("tbl_catalogue_formations")
      .select(`
        *,
        competences:tbl_catalogue_formations_competences(
          competence:competences(id, libelle, code)
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération formation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Formater les compétences
    const formatted = {
      ...data,
      competences: (data.competences || []).map((c: any) => c.competence).filter(Boolean),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET formation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une formation du catalogue
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
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

    // Mettre à jour la formation
    const { data, error: updateError } = await supabase
      .from("tbl_catalogue_formations")
      .update({
        ...formationData,
        updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur mise à jour formation:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Mettre à jour les compétences si fournies
    if (competences !== undefined && Array.isArray(competences)) {
      // Supprimer les anciennes associations
      await supabase
        .from("tbl_catalogue_formations_competences")
        .delete()
        .eq("catalogue_formation_id", id);

      // Créer les nouvelles associations
      if (competences.length > 0) {
        const competencesData = competences.map((compId: string) => ({
          catalogue_formation_id: id,
          competence_id: compId,
        }));

        const { error: compError } = await supabase
          .from("tbl_catalogue_formations_competences")
          .insert(competencesData);

        if (compError) {
          console.error("Erreur association compétences:", compError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH formation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Désactiver une formation (soft delete)
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
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

    // Soft delete : désactiver
    const { data, error } = await supabase
      .from("tbl_catalogue_formations")
      .update({
        is_active: false,
        updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur désactivation formation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la désactivation" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur DELETE formation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

