import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import { sendAccountCreationEmail } from "@/lib/email/sendgrid";

// Types explicites pour contourner le problème 'never' de Supabase
interface TblUsersInsert {
  id: string;
  email: string;
  role_id?: string | null;
  statut?: 'actif' | 'inactif' | 'suspendu' | 'en_attente';
  password_expires_at?: string | null;
}

interface UserRolesInsert {
  user_id: string;
  role_id: string;
  site_id?: string | null;
}

interface AuditLogInsert {
  action: string;
  type_entite?: string | null;
  entite_id?: string | null;
  details?: Json;
  user_id?: string | null;
}

/**
 * API Route pour créer un utilisateur (Admin uniquement)
 * Crée le compte dans auth.users et dans tbl_users
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nom, prenom, role_id, role_ids, site_id } = body;

    // Support pour role_id (ancien) et role_ids (nouveau - multiple)
    const roleIds = role_ids && Array.isArray(role_ids) && role_ids.length > 0 
      ? role_ids 
      : (role_id ? [role_id] : []);

    if (!email || !password || roleIds.length === 0) {
      return NextResponse.json(
        { error: "Email, mot de passe et au moins un rôle requis" },
        { status: 400 }
      );
    }

    // Utiliser le service role key pour créer l'utilisateur
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Erreur lors de la création du compte" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Calculer la date d'expiration du mot de passe provisoire (48h)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setHours(passwordExpiresAt.getHours() + 48);

    // Créer l'utilisateur dans tbl_users
    // Prendre le premier rôle pour role_id (compatibilité avec l'ancien système)
    const userData: TblUsersInsert = {
      id: userId,
      email,
      role_id: roleIds[0] || null,
      statut: "actif",
      password_expires_at: passwordExpiresAt.toISOString(),
    };
    const { error: userError } = await supabaseAdmin
      .from("tbl_users")
      .insert(userData as never);

    if (userError) {
      // Rollback: supprimer l'utilisateur auth si erreur
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil utilisateur" },
        { status: 500 }
      );
    }

    // Créer les associations user_roles pour tous les rôles sélectionnés
    if (roleIds.length > 0) {
      const rolesData: UserRolesInsert[] = roleIds.map((roleId: string) => ({
        user_id: userId,
        role_id: roleId,
        site_id: site_id || null,
      }));

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert(rolesData as never);

      if (roleError) {
        console.error("Erreur attribution rôles:", roleError);
        // Ne pas rollback, l'utilisateur peut être créé sans rôle attribué
      }
    }

    // Envoyer l'email de création avec le mot de passe provisoire
    try {
      await sendAccountCreationEmail(email, nom, prenom, password);
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // Ne pas faire échouer la création si l'email échoue
    }

    // Enregistrer dans l'audit
    const auditData: AuditLogInsert = {
      action: "creation_compte",
      type_entite: "user",
      entite_id: userId,
      details: {
        email,
        role_ids: roleIds,
        site_id,
      } as Json,
    };
    await supabaseAdmin.from("tbl_audit_log").insert(auditData as never);

    return NextResponse.json({
      success: true,
      user_id: userId,
      message: "Compte créé avec succès",
    });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

