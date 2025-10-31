import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isRHOrAdmin } from "@/lib/auth/rh-check";

// GET - Détails d'une habilitation
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
      .from("habilitations")
      .select(`
        *,
        collaborateur:collaborateurs!habilitations_collaborateur_id_fkey(id, nom, prenom, email, user_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération habilitation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Habilitation introuvable" }, { status: 404 });
    }

    const hasRHAccess = await isRHOrAdmin(user.id);
    const isOwner = data.collaborateur?.user_id === user.id;

    if (!hasRHAccess && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET habilitation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une habilitation
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

    const hasRHAccess = await isRHOrAdmin(user.id);
    if (!hasRHAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("habilitations")
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour habilitation:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH habilitation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une habilitation
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

    const hasRHAccess = await isRHOrAdmin(user.id);
    if (!hasRHAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase
      .from("habilitations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression habilitation:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE habilitation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

