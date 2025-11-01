import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin, canValidateAbsences } from "@/lib/auth/rh-check";

// GET - Historique des validations d'une absence
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // Vérifier que l'utilisateur peut voir cette absence
    const { data: absence } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, user_id, responsable_id, responsable_activite_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (!absence) {
      return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    const canValidate = await canValidateAbsences(user.id);
    const isOwner = absence.collaborateur?.user_id === user.id;

    // Vérifier les droits
    if (!hasRHAccess && !canValidate && !isOwner) {
      // Vérifier si l'utilisateur est responsable
      let isResponsable = false;
      if (absence.collaborateur?.responsable_id) {
        const { data: responsable } = await supabase
          .from("collaborateurs")
          .select("user_id")
          .eq("id", absence.collaborateur.responsable_id)
          .maybeSingle();
        isResponsable = responsable?.user_id === user.id;
      }
      if (absence.collaborateur?.responsable_activite_id) {
        const { data: responsableActivite } = await supabase
          .from("collaborateurs")
          .select("user_id")
          .eq("id", absence.collaborateur.responsable_activite_id)
          .maybeSingle();
        isResponsable = isResponsable || responsableActivite?.user_id === user.id;
      }
      
      if (!isResponsable) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    // Récupérer l'historique
    const { data: historique, error } = await supabase
      .from("historique_validations_absences")
      .select(`
        *,
        valide_par_user:tbl_users!historique_validations_absences_valide_par_fkey(id, email)
      `)
      .eq("absence_id", id)
      .order("date_action", { ascending: false });

    if (error) {
      console.error("Erreur récupération historique:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(historique || []);
  } catch (error) {
    console.error("Erreur GET historique absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

