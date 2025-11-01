import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Récupérer un collaborateur par ID
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

    const hasRHAccess = await isRHOrAdmin(user.id);

    let query = supabase
      .from("collaborateurs")
      .select("*")
      .eq("id", id);

    if (!hasRHAccess) {
      // Les non-RH voient seulement leur propre fiche
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Erreur récupération collaborateur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Collaborateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET collaborateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un collaborateur
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

    // Utiliser le service role key pour bypasser RLS (comme dans les pages admin)
    // Cela garantit que la mise à jour fonctionne même si RLS est restrictif
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

    const body = await request.json();

    // Log de debug en développement
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG API PATCH - Données reçues:", body);
      console.log("🔍 DEBUG API PATCH - ID collaborateur:", id);
      console.log("🔍 DEBUG API PATCH - User ID:", user.id);
      console.log("🔍 DEBUG API PATCH - Utilise service role:", !!supabaseAdmin);
    }

    // Définir uniquement les colonnes qui existent dans la table collaborateurs
    const allowedFields = [
      'nom', 'prenom', 'email', 'telephone', 
      'site', 'site_id', 'responsable_id', 'responsable_activite_id', 
      'fonction_metier', 'type_contrat', 'date_embauche', 'date_fin_contrat',
      'statut', 'competence_principale_id', 'competence_secondaire_ids', 
      'commentaire'
    ];

    // Construire l'objet avec uniquement les champs autorisés
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
    };

    // Filtrer et nettoyer les champs
    allowedFields.forEach((key) => {
      const value = body[key];
      if (value !== undefined) {
        if (value === "" || value === null) {
          updateData[key] = null;
        } else {
          updateData[key] = value;
        }
      }
    });

    // Log de debug après nettoyage
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG API PATCH - Données nettoyées:", updateData);
    }

    // Si site_id est renseigné, récupérer le libellé du site pour remplir le champ site (deprecated)
    if (updateData.site_id && typeof updateData.site_id === 'string') {
      const { data: siteData } = await clientToUse
        .from("tbl_sites")
        .select("site_code, site_label")
        .eq("site_id", updateData.site_id)
        .maybeSingle();
      
      if (siteData) {
        updateData.site = `${siteData.site_code} - ${siteData.site_label}`;
      }
    }

    const { data, error } = await clientToUse
      .from("collaborateurs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour collaborateur:", error);
      console.error("Données envoyées:", JSON.stringify(updateData, null, 2));
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH collaborateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un collaborateur (soft delete en changeant le statut)
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

    // Soft delete : changer le statut à 'inactif' au lieu de supprimer
    const { data, error } = await supabase
      .from("collaborateurs")
      .update({ 
        statut: 'inactif',
        updated_by: user.id 
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur suppression collaborateur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur DELETE collaborateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

