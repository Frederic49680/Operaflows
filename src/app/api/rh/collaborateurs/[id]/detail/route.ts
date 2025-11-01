import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les droits
    const hasRHAccess = await isRHOrAdmin(user.id);

    // Utiliser le service role key pour bypasser RLS si disponible
    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )
      : null;

    const clientToUse = supabaseAdmin || supabase;

    // Récupérer le collaborateur
    const { data: collaborateur, error: collabError } = await clientToUse
      .from("collaborateurs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (collabError || !collaborateur) {
      return NextResponse.json(
        { error: "Collaborateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!hasRHAccess && collaborateur.user_id !== user.id) {
      // Vérifier si l'utilisateur est responsable
      const isResponsable = 
        (collaborateur.responsable_id && 
         (await clientToUse
           .from("collaborateurs")
           .select("user_id")
           .eq("id", collaborateur.responsable_id)
           .maybeSingle()).data?.user_id === user.id) ||
        (collaborateur.responsable_activite_id &&
         (await clientToUse
           .from("collaborateurs")
           .select("user_id")
           .eq("id", collaborateur.responsable_activite_id)
           .maybeSingle()).data?.user_id === user.id);

      if (!isResponsable) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    // Récupérer les données liées
    let responsable = null;
    let userData = null;

    if (collaborateur.responsable_id) {
      const { data: respData } = await clientToUse
        .from("collaborateurs")
        .select("id, nom, prenom, email, user_id")
        .eq("id", collaborateur.responsable_id)
        .maybeSingle();
      responsable = respData;
    }

    if (collaborateur.user_id) {
      const { data: uData } = await clientToUse
        .from("tbl_users")
        .select("id, email")
        .eq("id", collaborateur.user_id)
        .maybeSingle();
      userData = uData;
    }

    // Récupérer les données pour les onglets
    const [habilitations, dosimetries, visitesMedicales, absences, formations, competences] = await Promise.all([
      supabase
        .from("habilitations")
        .select("*")
        .eq("collaborateur_id", id)
        .order("date_expiration", { ascending: true, nullsFirst: false }),
      
      supabase
        .from("dosimetrie")
        .select("*")
        .eq("collaborateur_id", id)
        .order("periode_debut", { ascending: false }),
      
      supabase
        .from("visites_medicales")
        .select("*")
        .eq("collaborateur_id", id)
        .order("date_visite", { ascending: false }),
      
      supabase
        .from("absences")
        .select(`
          *,
          valide_par_user:valide_par(id, email)
        `)
        .eq("collaborateur_id", id)
        .order("date_debut", { ascending: false }),
      
      supabase
        .from("formations")
        .select("*")
        .eq("collaborateur_id", id)
        .order("date_debut", { ascending: false }),
      
      supabase
        .from("collaborateurs_competences")
        .select(`
          *,
          competence:competence_id(*)
        `)
        .eq("collaborateur_id", id)
        .order("date_obtention", { ascending: false }),
    ]);

    // Récupérer les données pour le formulaire d'édition
    const [sitesResult, responsablesResult, usersResult] = await Promise.all([
      clientToUse
        .from("tbl_sites")
        .select("site_id, site_code, site_label")
        .eq("is_active", true)
        .order("site_code", { ascending: true }),
      clientToUse
        .from("collaborateurs")
        .select("id, nom, prenom")
        .eq("statut", "actif")
        .order("nom", { ascending: true }),
      clientToUse
        .from("tbl_users")
        .select("id, email")
        .eq("statut", "actif")
        .order("email", { ascending: true }),
    ]);

    return NextResponse.json({
      collaborateur: {
        ...collaborateur,
        responsable: responsable ? { id: responsable.id, nom: responsable.nom, prenom: responsable.prenom, email: responsable.email } : null,
        user: userData ? { id: userData.id, email: userData.email } : null,
      },
      habilitations: habilitations.data || [],
      dosimetries: dosimetries.data || [],
      visitesMedicales: visitesMedicales.data || [],
      absences: absences.data || [],
      formations: formations.data || [],
      competences: competences.data || [],
      sites: sitesResult.data || [],
      responsables: responsablesResult.data || [],
      availableUsers: usersResult.data || [],
      hasRHAccess,
    });
  } catch (error) {
    console.error("Erreur récupération détail collaborateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

