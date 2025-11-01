import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin, canValidateAbsences } from "@/lib/auth/rh-check";

// GET - Détails d'une absence
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

    const { data, error } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, nom, prenom, email, user_id),
        valide_par_user:valide_par(id, email)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération absence:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    }

    // Vérifier les droits
    const hasRHAccess = await isRHOrAdmin(user.id);
    const isOwner = data.collaborateur?.user_id === user.id;

    if (!hasRHAccess && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une absence
export async function PATCH(
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

    // Récupérer l'absence existante
    const { data: existingAbsence } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, user_id, responsable_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (!existingAbsence) {
      return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const { statut, ...updateData } = body;

    const hasRHAccess = await isRHOrAdmin(user.id);
    const canValidate = await canValidateAbsences(user.id);
    const isOwner = existingAbsence.collaborateur?.user_id === user.id;

    // Vérifier les droits selon l'opération
    if (statut && statut !== existingAbsence.statut) {
      // Validation/refus nécessite des droits spécifiques selon le niveau
      const isValidationN1 = statut === "validee_n1" || statut === "refusee_n1";
      const isValidationRH = statut === "validee_rh" || statut === "refusee_rh" || statut === "appliquee";
      
      if (isValidationN1 && !canValidate && !hasRHAccess) {
        return NextResponse.json(
          { error: "Non autorisé à valider cette absence au niveau N+1" },
          { status: 403 }
        );
      }
      
      if (isValidationRH && !hasRHAccess) {
        return NextResponse.json(
          { error: "Non autorisé à valider cette absence au niveau RH" },
          { status: 403 }
        );
      }
      
      // Vérifier que le statut actuel permet la transition
      if (isValidationN1 && existingAbsence.statut !== "en_attente_validation_n1") {
        return NextResponse.json(
          { error: "Cette absence n'est pas en attente de validation N+1" },
          { status: 400 }
        );
      }
      
      if (isValidationRH && existingAbsence.statut !== "en_attente_validation_rh") {
        return NextResponse.json(
          { error: "Cette absence n'est pas en attente de validation RH" },
          { status: 400 }
        );
      }
    } else {
      // Modification normale
      if (!hasRHAccess && !isOwner) {
        return NextResponse.json(
          { error: "Non autorisé à modifier cette absence" },
          { status: 403 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      ...updateData,
      updated_by: user.id,
    };

    if (statut) {
      updatePayload.statut = statut;
      
      // Mettre à jour les champs selon le niveau de validation
      if (statut === "validee_n1" || statut === "refusee_n1") {
        updatePayload.valide_par_n1 = user.id;
        updatePayload.date_validation_n1 = new Date().toISOString();
        updatePayload.valide_par = user.id; // Compatibilité
        updatePayload.date_validation = new Date().toISOString(); // Compatibilité
      } else if (statut === "validee_rh" || statut === "refusee_rh" || statut === "appliquee") {
        updatePayload.valide_par_rh = user.id;
        updatePayload.date_validation_rh = new Date().toISOString();
        updatePayload.valide_par = user.id; // Compatibilité
        updatePayload.date_validation = new Date().toISOString(); // Compatibilité
        
        // Si validée RH, activer l'impact planification
        if (statut === "validee_rh" || statut === "appliquee") {
          updatePayload.impact_planif = true;
        }
      }
    }

    const { data, error } = await supabase
      .from("absences")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour absence:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une absence
export async function DELETE(
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

    // Récupérer l'absence
    const { data: absence } = await supabase
      .from("absences")
      .select(`
        *,
        collaborateur:collaborateurs!absences_collaborateur_id_fkey(id, user_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (!absence) {
      return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    const isOwner = absence.collaborateur?.user_id === user.id;

    if (!hasRHAccess && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase
      .from("absences")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression absence:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

