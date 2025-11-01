import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH - Mettre à jour le plan prévisionnel (validation, modification)
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

    // Si validation ou refus, ajouter les infos de validation
    const updateData: any = {
      ...body,
      updated_by: user.id,
    };

    if (body.statut_validation === 'valide' || body.statut_validation === 'refusé') {
      updateData.valide_par = user.id;
      updateData.date_validation = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("tbl_plan_previsionnel_formations")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        collaborateur:collaborateurs!tbl_plan_previsionnel_formations_collaborateur_id_fkey(id, nom, prenom, email),
        catalogue_formation:tbl_catalogue_formations(id, nom, code_interne, categorie)
      `)
      .single();

    if (error) {
      console.error("Erreur mise à jour plan prévisionnel:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH plan prévisionnel:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Convertir le plan prévisionnel en formation réelle
export async function POST(
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

    // Récupérer le plan prévisionnel
    const { data: planPrev, error: planError } = await supabase
      .from("tbl_plan_previsionnel_formations")
      .select("*")
      .eq("id", id)
      .single();

    if (planError || !planPrev) {
      return NextResponse.json(
        { error: "Plan prévisionnel non trouvé" },
        { status: 404 }
      );
    }

    if (planPrev.statut_validation !== 'valide') {
      return NextResponse.json(
        { error: "Le plan prévisionnel doit être validé avant conversion" },
        { status: 400 }
      );
    }

    // Récupérer les infos du catalogue si disponible
    let formationData: any = {
      collaborateur_id: planPrev.collaborateur_id,
      libelle: planPrev.catalogue_formation_id
        ? null // Sera rempli depuis le catalogue
        : planPrev.formation_libelle || "Formation",
      date_debut: planPrev.date_cible || new Date().toISOString().split('T')[0],
      statut: 'planifiee',
      impact_planif: true,
      plan_previsionnel_id: planPrev.id,
      catalogue_formation_id: planPrev.catalogue_formation_id,
      priorite: planPrev.priorite,
      created_by: user.id,
      updated_by: user.id,
    };

    // Si lié au catalogue, récupérer les infos
    if (planPrev.catalogue_formation_id) {
      const { data: catalogue } = await supabase
        .from("tbl_catalogue_formations")
        .select("*")
        .eq("id", planPrev.catalogue_formation_id)
        .single();

      if (catalogue) {
        formationData.libelle = catalogue.nom;
        formationData.type_formation = 'externe'; // Par défaut
        formationData.duree_heures = catalogue.duree_heures;
        formationData.organisme_formateur = catalogue.organisme_formateur;
        formationData.validite_mois = catalogue.periodicite_validite_mois;
      }
    }

    // Créer la formation
    const { data: formation, error: formError } = await supabase
      .from("formations")
      .insert(formationData)
      .select()
      .single();

    if (formError) {
      console.error("Erreur création formation:", formError);
      return NextResponse.json(
        { error: formError.message },
        { status: 400 }
      );
    }

    // Mettre à jour le plan prévisionnel pour marquer la conversion
    await supabase
      .from("tbl_plan_previsionnel_formations")
      .update({
        convertie_en_formation_id: formation.id,
        date_conversion: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", id);

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    console.error("Erreur conversion plan prévisionnel:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

