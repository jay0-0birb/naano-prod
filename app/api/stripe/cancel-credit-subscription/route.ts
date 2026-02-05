import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * Cancel SaaS credit subscription
 * POST /api/stripe/cancel-credit-subscription
 *
 * Immediately cancels the Stripe subscription used for monthly credit renewal.
 * Existing credits remain on the account (handled by webhook logic).
 */
export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 },
      );
    }

    const { data: saasCompany } = await supabase
      .from("saas_companies")
      .select("id, stripe_subscription_id_credits")
      .eq("profile_id", user.id)
      .single();

    if (!saasCompany || !saasCompany.stripe_subscription_id_credits) {
      return NextResponse.json(
        { error: "Aucun abonnement crédits actif trouvé." },
        { status: 400 },
      );
    }

    const subscriptionId = saasCompany.stripe_subscription_id_credits;

    // Cancel the subscription immediately. Webhook will update DB (clear subscription id, keep credits).
    await stripe.subscriptions.cancel(subscriptionId);

    return NextResponse.json({
      success: true,
      message: "Abonnement crédits annulé. Vos crédits restants restent disponibles jusqu'à épuisement.",
    });
  } catch (error: any) {
    console.error("Cancel credit subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 },
    );
  }
}

