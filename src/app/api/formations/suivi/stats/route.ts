import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Statistiques du suivi des formations
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
    const annee = searchParams.get("annee") || new Date().getFullYear().toString();

    // Statistiques formations terminées
    const { data: formationsTerminees } = await supabase
      .from("formations")
      .select("cout_reel, date_echeance_validite")
      .eq("statut", "terminee")
      .gte("date_debut", `${annee}-01-01`)
      .lte("date_debut", `${annee}-12-31`);

    // Alertes d'échéances
    const { data: alertes } = await supabase
      .from("v_alertes_formations")
      .select("*")
      .limit(50);

    // Plan prévisionnel
    const { data: planPrev } = await supabase
      .from("tbl_plan_previsionnel_formations")
      .select("statut_validation, budget_estime")
      .eq("periode_annee", parseInt(annee));

    // Répartition par catégorie
    const { data: repartition } = await supabase
      .from("formations")
      .select(`
        catalogue_formation:tbl_catalogue_formations(categorie)
      `)
      .eq("statut", "terminee")
      .gte("date_debut", `${annee}-01-01`)
      .lte("date_debut", `${annee}-12-31`)
      .not("catalogue_formation_id", "is", null);

    // Budget
    const budgetConsomme = formationsTerminees
      ?.filter(f => f.cout_reel)
      .reduce((sum, f) => sum + (f.cout_reel || 0), 0) || 0;

    const budgetPrev = planPrev
      ?.filter(p => p.statut_validation === 'valide')
      .reduce((sum, p) => sum + (p.budget_estime || 0), 0) || 0;

    // Répartition par catégorie
    const repartitionCategorie: Record<string, number> = {};
    repartition?.forEach((r: any) => {
      const cat = r.catalogue_formation?.categorie || "Autre";
      repartitionCategorie[cat] = (repartitionCategorie[cat] || 0) + 1;
    });

    // Taux de conformité (formations à jour / total)
    const formationsAvecEcheance = formationsTerminees?.filter(f => f.date_echeance_validite) || [];
    const formationsAJour = formationsAvecEcheance.filter(f => {
      if (!f.date_echeance_validite) return false;
      return new Date(f.date_echeance_validite) >= new Date();
    });
    const tauxConformite = formationsAvecEcheance.length > 0
      ? (formationsAJour.length / formationsAvecEcheance.length) * 100
      : 100;

    return NextResponse.json({
      annee: parseInt(annee),
      total_formations_terminees: formationsTerminees?.length || 0,
      budget_consomme: budgetConsomme,
      budget_previsionnel: budgetPrev,
      taux_conformite: Math.round(tauxConformite),
      alertes_expirees: alertes?.filter(a => a.statut_alerte === 'expiree').length || 0,
      alertes_imminentes: alertes?.filter(a => a.statut_alerte === 'echeance_imminente').length || 0,
      alertes_proches: alertes?.filter(a => a.statut_alerte === 'echeance_proche').length || 0,
      repartition_categorie: repartitionCategorie,
      plan_previsionnel: {
        total: planPrev?.length || 0,
        en_attente: planPrev?.filter(p => p.statut_validation === 'en_attente').length || 0,
        valide: planPrev?.filter(p => p.statut_validation === 'valide').length || 0,
      },
      alertes_detail: alertes || [],
    });
  } catch (error) {
    console.error("Erreur GET stats formations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

