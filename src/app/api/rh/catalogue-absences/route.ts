import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Liste du catalogue des absences
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
    const isActive = searchParams.get("is_active");
    const categorie = searchParams.get("categorie");

    let query = supabase.from("catalogue_absences").select("*");

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (categorie) {
      query = query.eq("categorie", categorie);
    }

    const { data, error } = await query.order("code", { ascending: true });

    if (error) {
      console.error("Erreur récupération catalogue absences:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erreur GET catalogue absences:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un type d'absence dans le catalogue
export async function POST(request: Request) {
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

    const body = await request.json();
    const { code, libelle, description, categorie, duree_max_jours, duree_min_jours, besoin_justificatif, besoin_validation_n1, besoin_validation_rh, motif_complementaire, conditions_particulieres, is_active } = body;

    if (!code || !libelle || !categorie) {
      return NextResponse.json(
        { error: "Code, libellé et catégorie sont obligatoires" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("catalogue_absences")
      .insert({
        code: code.toUpperCase().trim(),
        libelle: libelle.trim(),
        description: description?.trim() || null,
        categorie,
        duree_max_jours: duree_max_jours || null,
        duree_min_jours: duree_min_jours || null,
        besoin_justificatif: besoin_justificatif ?? false,
        besoin_validation_n1: besoin_validation_n1 ?? true,
        besoin_validation_rh: besoin_validation_rh ?? true,
        motif_complementaire: motif_complementaire?.trim() || null,
        conditions_particulieres: conditions_particulieres?.trim() || null,
        is_active: is_active ?? true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création type absence:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur POST catalogue absence:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

