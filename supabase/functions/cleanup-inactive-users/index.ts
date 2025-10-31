// Supabase Edge Function : Nettoyage des comptes non activés
// À exécuter via un cron quotidien

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion CORS pour les requêtes OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialiser Supabase avec service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const expirationDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48h en arrière

    // 1. Supprimer les comptes non activés après 48h
    const { data: expiredUsers, error: expiredError } = await supabase
      .from("tbl_users")
      .select("id, email, password_expires_at")
      .eq("statut", "en_attente")
      .lt("password_expires_at", expirationDate.toISOString());

    if (expiredError) {
      throw expiredError;
    }

    let deletedCount = 0;
    if (expiredUsers && expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        // Supprimer de auth.users
        await supabase.auth.admin.deleteUser(user.id);
        deletedCount++;
      }
    }

    // 2. Suspendre les comptes inactifs > 90 jours
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from("tbl_users")
      .select("id, email, derniere_connexion")
      .eq("statut", "actif")
      .lt("derniere_connexion", ninetyDaysAgo.toISOString());

    if (inactiveError) {
      throw inactiveError;
    }

    let suspendedCount = 0;
    if (inactiveUsers && inactiveUsers.length > 0) {
      const userIds = inactiveUsers.map((u) => u.id);
      const { error: suspendError } = await supabase
        .from("tbl_users")
        .update({ statut: "suspendu" })
        .in("id", userIds);

      if (suspendError) {
        throw suspendError;
      }
      suspendedCount = inactiveUsers.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_accounts: deletedCount,
        suspended_accounts: suspendedCount,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

