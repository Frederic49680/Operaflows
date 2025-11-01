import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Détails d'un relevé dosimétrique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("dosimetrie")
      .select(`
        *,
        collaborateur:collaborateurs!dosimetrie_collaborateur_id_fkey(id, nom, prenom, email)
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Erreur récupération dosimétrie:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    // Vérifier les permissions (utilisateur peut voir son propre relevé, RH peut tout voir)
    const hasRHAccess = await isRHOrAdmin(user.id);
    if (!hasRHAccess && data.collaborateur?.id) {
      const { data: collab } = await supabase
        .from("collaborateurs")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", data.collaborateur.id)
        .maybeSingle();

      if (!collab) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET dosimétrie:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un relevé dosimétrique
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { ...dosimetrieData } = body;

    const { data, error } = await supabase
      .from("dosimetrie")
      .update({
        ...dosimetrieData,
        updated_by: user.id,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour dosimétrie:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH dosimétrie:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un relevé dosimétrique
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from("dosimetrie")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Erreur suppression dosimétrie:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE dosimétrie:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

