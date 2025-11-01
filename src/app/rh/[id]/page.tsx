import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
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

  // Récupérer le collaborateur
  // Utiliser maybeSingle() pour gérer le cas où le collaborateur n'existe pas ou n'est pas accessible
  const { data: collaborateur, error: collabError } = await supabase
    .from("collaborateurs")
    .select(`
      *,
      responsable:collaborateurs!collaborateurs_responsable_id_fkey(id, nom, prenom, email),
      user:user_id(id, email)
    `)
    .eq("id", id)
    .maybeSingle();

  // Log de debug en développement
  if (process.env.NODE_ENV === "development" && collabError) {
    console.error("❌ Erreur récupération collaborateur:", collabError);
    console.error("Code:", collabError.code);
    console.error("Message:", collabError.message);
    console.error("Details:", collabError.details);
    console.error("Hint:", collabError.hint);
  }

  if (!collaborateur) {
    // Si l'erreur est liée à RLS, rediriger vers unauthorized plutôt que notFound
    if (collabError?.code === "42501" || collabError?.message?.includes("policy")) {
      redirect("/unauthorized");
    }
    notFound();
  }

  // Vérifier que l'utilisateur peut voir ce collaborateur
  if (!hasRHAccess && collaborateur.user_id !== user.id) {
    // Si l'utilisateur n'est pas RH/Admin et que ce n'est pas son propre profil,
    // vérifier s'il est responsable via une fonction helper pour éviter la récursion RLS
    // On utilise responsable_id directement depuis les données déjà récupérées
    if (collaborateur.responsable_id) {
      // Vérifier via une requête simple qui utilise RLS (mais avec les nouvelles politiques simplifiées)
      // Ou utiliser une fonction helper si disponible
      const { data: responsable } = await supabase
        .from("collaborateurs")
        .select("user_id")
        .eq("id", collaborateur.responsable_id)
        .maybeSingle();
      
      if (responsable?.user_id !== user.id) {
        // Aussi vérifier responsable_activite_id si disponible
        if (collaborateur.responsable_activite_id) {
          const { data: respActivite } = await supabase
            .from("collaborateurs")
            .select("user_id")
            .eq("id", collaborateur.responsable_activite_id)
            .maybeSingle();
          
          if (respActivite?.user_id !== user.id) {
            redirect("/unauthorized");
          }
        } else {
          redirect("/unauthorized");
        }
      }
    } else if (!collaborateur.responsable_activite_id) {
      // Aucun responsable trouvé, pas autorisé
      redirect("/unauthorized");
    } else {
      // Vérifier responsable_activite_id
      const { data: respActivite } = await supabase
        .from("collaborateurs")
        .select("user_id")
        .eq("id", collaborateur.responsable_activite_id)
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
      collaborateur={collaborateur}
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

