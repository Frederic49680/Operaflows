import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Statistiques et indicateurs RH pour les absences
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
    if (!hasRHAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const searchParams = new URL(request.url).searchParams;
    const dateDebut = searchParams.get("date_debut");
    const dateFin = searchParams.get("date_fin");
    const siteId = searchParams.get("site_id");

    // Note: On utilise des requêtes Supabase standard pour calculer les statistiques

    // Fallback : requêtes Supabase standard
    let absencesQuery = supabase
      .from("absences")
      .select("statut, duree_jours, collaborateur_id, date_debut, date_fin");

    if (dateDebut) {
      absencesQuery = absencesQuery.gte("date_debut", dateDebut);
    }
    if (dateFin) {
      absencesQuery = absencesQuery.lte("date_fin", dateFin);
    }
    if (siteId) {
      // Joindre avec collaborateurs pour filtrer par site
      absencesQuery = absencesQuery
        .select("*, collaborateur:collaborateurs!absences_collaborateur_id_fkey(site_id)");
    }

    const { data: absences, error } = await absencesQuery;

    if (error) {
      console.error("Erreur récupération statistiques:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    // Calculer les statistiques manuellement
    const statsCalculated = {
      en_attente_n1: absences?.filter(a => a.statut === "en_attente_validation_n1").length || 0,
      validees_n1: absences?.filter(a => a.statut === "validee_n1").length || 0,
      refusees_n1: absences?.filter(a => a.statut === "refusee_n1").length || 0,
      en_attente_rh: absences?.filter(a => a.statut === "en_attente_validation_rh").length || 0,
      validees_rh: absences?.filter(a => a.statut === "validee_rh" || a.statut === "appliquee").length || 0,
      refusees_rh: absences?.filter(a => a.statut === "refusee_rh").length || 0,
      annulees: absences?.filter(a => a.statut === "annulee").length || 0,
      total_jours_valides: absences
        ?.filter(a => a.statut === "validee_rh" || a.statut === "appliquee")
        .reduce((sum, a) => sum + (a.duree_jours || 0), 0) || 0,
      collaborateurs_absents: new Set(
        absences
          ?.filter(a => a.statut === "validee_rh" || a.statut === "appliquee")
          .map(a => a.collaborateur_id) || []
      ).size,
      total_absences: absences?.length || 0,
    };

    // Statistiques par catégorie
    const { data: absencesParCategorie } = await supabase
      .from("absences")
      .select(`
        type,
        catalogue_absence:catalogue_absences!absences_catalogue_absence_id_fkey(categorie),
        statut,
        duree_jours
      `);

    const categorieStats: Record<string, { total: number; jours: number }> = {};
    absencesParCategorie?.forEach((abs) => {
      const categorie = abs.catalogue_absence?.categorie || "autre";
      if (!categorieStats[categorie]) {
        categorieStats[categorie] = { total: 0, jours: 0 };
      }
      categorieStats[categorie].total++;
      if (abs.statut === "validee_rh" || abs.statut === "appliquee") {
        categorieStats[categorie].jours += abs.duree_jours || 0;
      }
    });

    return NextResponse.json({
      ...statsCalculated,
      par_categorie: categorieStats,
    });
  } catch (error) {
    console.error("Erreur GET statistiques absences:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

