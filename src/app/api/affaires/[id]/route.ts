import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Récupérer une affaire avec toutes ses données
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

    const { data, error } = await clientToUse
      .from("tbl_affaires")
      .select(`
        *,
        charge_affaires:collaborateurs!tbl_affaires_charge_affaires_id_fkey(id, nom, prenom),
        site:tbl_sites!tbl_affaires_site_id_fkey(site_id, site_code, site_label),
        bpu:tbl_affaires_bpu(*),
        depenses:tbl_affaires_depenses(*),
        lots:tbl_affaires_lots(*),
        pre_planif:tbl_affaires_pre_planif(*),
        documents:tbl_affaires_documents(*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération affaire:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Affaire non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET affaire:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une affaire
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

    // Vérifier les droits
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const hasAccess = userRoles?.some((ur) => {
      const role = Array.isArray(ur.roles) ? ur.roles[0] : ur.roles;
      return role?.name && [
        "Administrateur",
        "Administratif RH",
        "RH",
        "Chargé d'Affaires",
        "Responsable d'Activité",
      ].includes(role.name);
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { bpu, depenses, lots, ...affaireData } = body;

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

    // Mettre à jour l'affaire
    const { data, error: updateError } = await clientToUse
      .from("tbl_affaires")
      .update({
        ...affaireData,
        updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur mise à jour affaire:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Mettre à jour les lignes BPU si fournies
    if (bpu !== undefined && Array.isArray(bpu)) {
      // Supprimer les anciennes lignes
      await clientToUse
        .from("tbl_affaires_bpu")
        .delete()
        .eq("affaire_id", id);

      // Insérer les nouvelles lignes
      if (bpu.length > 0) {
        const bpuData = bpu.map((ligne: Record<string, unknown>) => ({
          ...ligne,
          affaire_id: id,
          created_by: user.id,
          updated_by: user.id,
        }));

        await clientToUse
          .from("tbl_affaires_bpu")
          .insert(bpuData);
      }
    }

    // Mettre à jour les dépenses si fournies
    if (depenses !== undefined && Array.isArray(depenses)) {
      // Supprimer les anciennes dépenses
      await clientToUse
        .from("tbl_affaires_depenses")
        .delete()
        .eq("affaire_id", id);

      // Insérer les nouvelles dépenses
      if (depenses.length > 0) {
        const depensesData = depenses.map((dep: Record<string, unknown>) => ({
          ...dep,
          affaire_id: id,
          created_by: user.id,
          updated_by: user.id,
        }));

        await clientToUse
          .from("tbl_affaires_depenses")
          .insert(depensesData);
      }
    }

    // Mettre à jour les lots si fournis
    if (lots !== undefined && Array.isArray(lots)) {
      // Supprimer les anciens lots
      await clientToUse
        .from("tbl_affaires_lots")
        .delete()
        .eq("affaire_id", id);

      // Insérer les nouveaux lots
      if (lots.length > 0) {
        const lotsData = lots.map((lot: Record<string, unknown>) => ({
          ...lot,
          affaire_id: id,
          created_by: user.id,
          updated_by: user.id,
        }));

        await clientToUse
          .from("tbl_affaires_lots")
          .insert(lotsData);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH affaire:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

