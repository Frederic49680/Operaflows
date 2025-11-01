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
      .select("user_id, responsable_id, responsable_activite_id")
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
    if (collab.responsable_id || collab.responsable_activite_id) {
      // Récupérer le profil collaborateur de l'utilisateur actuel
      const { data: monCollaborateur } = await supabase
        .from("collaborateurs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (monCollaborateur) {
        isResponsable = 
          collab.responsable_id === monCollaborateur.id ||
          collab.responsable_activite_id === monCollaborateur.id;
      }
    }

    if (!hasRHAccess && !isOwner && !isResponsable) {
      return NextResponse.json(
        { error: "Non autorisé à créer une absence pour ce collaborateur" },
        { status: 403 }
      );
    }

    // Logique de validation automatique selon le créateur
    const collaborateurSansCompte = !collab.user_id;
    const statutInitial = absenceData.statut || "en_attente_validation_n1";
    
    let statutFinal = statutInitial;
    let valideParN1 = null as string | null;
    let dateValidationN1 = null as string | null;
    let valideParRH = null as string | null;
    let dateValidationRH = null as string | null;
    
    // Cas 1 : Admin crée pour un tiers → validation automatique complète (N+1 et RH)
    if (hasRHAccess && !isOwner && statutInitial === "en_attente_validation_n1") {
      // L'admin crée pour quelqu'un d'autre : tout est validé automatiquement
      statutFinal = "validee_rh"; // Validation complète
      valideParN1 = user.id;
      dateValidationN1 = new Date().toISOString();
      valideParRH = user.id;
      dateValidationRH = new Date().toISOString();
      // Impact planification activé automatiquement
      if (absenceData.impact_planif === undefined || absenceData.impact_planif === null) {
        absenceData.impact_planif = true;
      }
    }
    // Cas 2 : N+1 crée pour un collaborateur sans compte → validation automatique N+1 uniquement
    else if (collaborateurSansCompte && isResponsable && !hasRHAccess && statutInitial === "en_attente_validation_n1") {
      // Le N+1 crée pour un collaborateur sans compte : validation automatique N+1
      statutFinal = "validee_n1";
      valideParN1 = user.id;
      dateValidationN1 = new Date().toISOString();
      // Le trigger SQL passera automatiquement en "en_attente_validation_rh"
    }

    const insertData: Record<string, unknown> = {
      collaborateur_id,
      ...absenceData,
      created_by: user.id,
      updated_by: user.id,
      statut: statutFinal,
    };

    // Si validation automatique N+1, remplir les champs de validation
    if (valideParN1 && dateValidationN1) {
      insertData.valide_par_n1 = valideParN1;
      insertData.date_validation_n1 = dateValidationN1;
      insertData.valide_par = valideParN1; // Compatibilité avec ancien champ
      insertData.date_validation = dateValidationN1; // Compatibilité
    }

    // Si validation automatique RH (cas admin), remplir les champs de validation RH
    if (valideParRH && dateValidationRH) {
      insertData.valide_par_rh = valideParRH;
      insertData.date_validation_rh = dateValidationRH;
      insertData.valide_par = valideParRH; // Compatibilité avec ancien champ
      insertData.date_validation = dateValidationRH; // Compatibilité
    }

    const { data, error } = await supabase
      .from("absences")
      .insert(insertData)
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

