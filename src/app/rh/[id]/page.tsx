import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isRHOrAdmin } from "@/lib/auth/rh-check";
import CollaborateurDetailClient from "./collaborateur-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollaborateurDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier les droits
  const hasRHAccess = await isRHOrAdmin(user.id);

  // Utiliser le service role key pour bypasser RLS si disponible (comme pour la page admin)
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
  // D'abord sans jointures complexes pour éviter les problèmes RLS
  const { data: collaborateur, error: collabError } = await clientToUse
      .from("collaborateurs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  // Si le collaborateur existe, récupérer les données liées séparément si nécessaire
  let responsable = null;
  let responsableUserId: string | null = null;
  let userData = null;
  
  if (collaborateur && collaborateur.responsable_id) {
    const { data: respData } = await clientToUse
      .from("collaborateurs")
      .select("id, nom, prenom, email, user_id")
      .eq("id", collaborateur.responsable_id)
      .maybeSingle();
    responsable = respData;
    responsableUserId = respData?.user_id || null;
  }
  
  if (collaborateur && collaborateur.user_id) {
    const { data: uData } = await clientToUse
      .from("tbl_users")
      .select("id, email")
      .eq("id", collaborateur.user_id)
      .maybeSingle();
    userData = uData;
  }
  
  // Enrichir le collaborateur avec les données jointes
  const collaborateurEnrichi = collaborateur ? {
    ...collaborateur,
    responsable: responsable ? { id: responsable.id, nom: responsable.nom, prenom: responsable.prenom, email: responsable.email } : null,
    user: userData ? { id: userData.id, email: userData.email } : null,
  } : null;

  // Log de debug en développement
  if (process.env.NODE_ENV === "development") {
    if (collabError) {
      console.error("❌ Erreur récupération collaborateur:", collabError);
      console.error("Code:", collabError.code);
      console.error("Message:", collabError.message);
      console.error("Details:", collabError.details);
      console.error("Hint:", collabError.hint);
    }
    console.log("🔍 DEBUG - Collaborateur récupéré:", collaborateurEnrichi ? "Oui" : "Non");
    console.log("🔍 DEBUG - ID recherché:", id);
    console.log("🔍 DEBUG - HasRHAccess:", hasRHAccess);
    console.log("🔍 DEBUG - Utilise service role:", !!supabaseAdmin);
  }

  if (!collaborateurEnrichi) {
    // Si l'erreur est liée à RLS, rediriger vers unauthorized plutôt que notFound
    if (collabError?.code === "42501" || collabError?.message?.includes("policy")) {
      redirect("/unauthorized");
    }
    notFound();
  }

  // Vérifier que l'utilisateur peut voir ce collaborateur
  if (!hasRHAccess && collaborateurEnrichi.user_id !== user.id) {
    // Si l'utilisateur n'est pas RH/Admin et que ce n'est pas son propre profil,
    // vérifier s'il est responsable
    if (collaborateurEnrichi.responsable_id) {
      if (responsableUserId !== user.id) {
        // Aussi vérifier responsable_activite_id si disponible
        if (collaborateurEnrichi.responsable_activite_id) {
          const { data: respActivite } = await clientToUse
            .from("collaborateurs")
            .select("user_id")
            .eq("id", collaborateurEnrichi.responsable_activite_id)
            .maybeSingle();
          
          if (respActivite?.user_id !== user.id) {
            redirect("/unauthorized");
          }
        } else {
          redirect("/unauthorized");
        }
      }
    } else if (!collaborateurEnrichi.responsable_activite_id) {
      // Aucun responsable trouvé, pas autorisé
      redirect("/unauthorized");
    } else {
      // Vérifier responsable_activite_id
      const { data: respActivite } = await clientToUse
        .from("collaborateurs")
        .select("user_id")
        .eq("id", collaborateurEnrichi.responsable_activite_id)
        .maybeSingle();
      
      if (respActivite?.user_id !== user.id) {
        redirect("/unauthorized");
      }
    }
  }

  // Récupérer les données pour chaque onglet
  const [habilitations, dosimetries, visitesMedicales, absences, formations, competences] = await Promise.all([
    // Habilitations
    supabase
      .from("habilitations")
      .select("*")
      .eq("collaborateur_id", id)
      .order("date_expiration", { ascending: true, nullsFirst: false }),
    
    // Dosimétrie
    supabase
      .from("dosimetrie")
      .select("*")
      .eq("collaborateur_id", id)
      .order("periode_debut", { ascending: false }),
    
    // Visites médicales
    supabase
      .from("visites_medicales")
      .select("*")
      .eq("collaborateur_id", id)
      .order("date_visite", { ascending: false }),
    
    // Absences
    supabase
      .from("absences")
      .select(`
        *,
        valide_par_user:valide_par(id, email)
      `)
      .eq("collaborateur_id", id)
      .order("date_debut", { ascending: false }),
    
    // Formations
    supabase
      .from("formations")
      .select("*")
      .eq("collaborateur_id", id)
      .order("date_debut", { ascending: false }),
    
    // Compétences
    supabase
      .from("collaborateurs_competences")
      .select(`
        *,
        competence:competence_id(*)
      `)
      .eq("collaborateur_id", id)
      .order("date_obtention", { ascending: false }),
  ]);

  return (
    <CollaborateurDetailClient
      collaborateur={collaborateurEnrichi}
      habilitations={habilitations.data || []}
      dosimetries={dosimetries.data || []}
      visitesMedicales={visitesMedicales.data || []}
      absences={absences.data || []}
      formations={formations.data || []}
      competences={competences.data || []}
      hasRHAccess={hasRHAccess}
    />
  );
}

