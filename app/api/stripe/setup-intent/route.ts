import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

// Use service role for API routes to bypass RLS
const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

/**
 * Create Stripe Setup Intent for card validation
 * Required for SaaS onboarding (Card required before dashboard access)
 */
export async function POST(request: Request) {
  console.log("[setup-intent] API called");

  try {
    if (!stripe) {
      console.error("[setup-intent] Stripe not configured");
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 503 }
      );
    }

    // Use regular client for auth check
    const supabase = await createClient();
    console.log("[setup-intent] Supabase client created");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[setup-intent] Auth error:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("[setup-intent] User authenticated:", user.id);

    // Use admin client to bypass RLS for SaaS company lookup
    if (!supabaseAdmin) {
      console.error("[setup-intent] Admin client not available");
      return NextResponse.json(
        { error: "Configuration serveur invalide" },
        { status: 500 }
      );
    }

    // Get SaaS company - try with error handling
    const { data: saasCompany, error: saasError } = await supabaseAdmin
      .from("saas_companies")
      .select("id, company_name, stripe_customer_id")
      .eq("profile_id", user.id)
      .single();

    console.log("SaaS company query result:", { saasCompany, saasError });

    if (saasError) {
      // If it's a "not found" error (PGRST116), that's expected if no record exists
      if (saasError.code === "PGRST116") {
        return NextResponse.json(
          {
            error:
              "Entreprise SaaS non trouvée. Veuillez compléter l'onboarding d'abord.",
            code: saasError.code,
          },
          { status: 404 }
        );
      }
      console.error("SaaS company lookup error:", saasError);
      return NextResponse.json(
        {
          error: "Erreur lors de la recherche de l'entreprise",
          details: saasError.message,
          code: saasError.code,
        },
        { status: 500 }
      );
    }

    if (!saasCompany) {
      console.error("No SaaS company found for user:", user.id);
      return NextResponse.json(
        {
          error:
            "Entreprise SaaS non trouvée. Veuillez compléter l'onboarding d'abord.",
        },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = saasCompany.stripe_customer_id;

    if (!customerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: profile?.email,
        name: profile?.full_name || saasCompany.company_name,
        metadata: {
          saas_id: saasCompany.id,
          profile_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID (use admin client)
      await supabaseAdmin
        .from("saas_companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", saasCompany.id);
    }

    // Create Setup Intent for card validation
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // For future payments
      metadata: {
        saas_id: saasCompany.id,
        purpose: "card_validation",
      },
    });

    console.log(
      "[setup-intent] Created setup intent:",
      setupIntent.id,
      "Status:",
      setupIntent.status
    );

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
    });
  } catch (error: any) {
    console.error("Setup Intent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
