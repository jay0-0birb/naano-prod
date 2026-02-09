"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Update creator SIRET (for Particuliers blocked at €500 to unlock withdrawals) */
export async function updateCreatorSiret(siret: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const trimmed = (siret || "").replace(/\s/g, "").trim();
  if (trimmed.length < 9) {
    return { error: "Numéro SIRET invalide (9 chiffres minimum)" };
  }

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      siret_number: trimmed,
      legal_status: "professionnel", // Unlock unlimited withdrawals
    })
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/finances");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

const NAANO_LINK = "https://naano.vercel.app/";

/**
 * Submit a Naano promo post to unlock Pro for 6 months.
 * Creator posts about Naano on LinkedIn, submits the post URL, gets Pro auto-unlocked.
 */
export async function submitProUnlockPost(linkedinPostUrl: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Validate LinkedIn URL
  if (!linkedinPostUrl.includes("linkedin.com/")) {
    return { error: "Veuillez entrer une URL de post LinkedIn valide" };
  }

  // Get creator profile
  const { data: creatorProfile, error: profileError } = await supabase
    .from("creator_profiles")
    .select("id, is_pro, pro_expiration_date")
    .eq("profile_id", user.id)
    .single();

  if (profileError || !creatorProfile) {
    return { error: "creator_profile_not_found" };
  }

  // Check eligibility: can unlock if not Pro, or Pro has expired
  const now = new Date();
  const expiration = creatorProfile.pro_expiration_date
    ? new Date(creatorProfile.pro_expiration_date)
    : null;

  if (creatorProfile.is_pro && expiration && expiration > now) {
    return {
      error: `Vous avez déjà Pro jusqu'au ${expiration.toLocaleDateString("fr-FR")}. Vous pourrez débloquer à nouveau après cette date.`,
    };
  }

  // Check for duplicate post URL
  const { data: existing } = await supabase
    .from("creator_pro_promo_posts")
    .select("id")
    .eq("creator_id", creatorProfile.id)
    .eq("linkedin_post_url", linkedinPostUrl)
    .single();

  if (existing) {
    return { error: "Ce post a déjà été soumis" };
  }

  // Insert promo post record
  const { error: insertError } = await supabase
    .from("creator_pro_promo_posts")
    .insert({
      creator_id: creatorProfile.id,
      linkedin_post_url: linkedinPostUrl,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  // Grant Pro for 6 months
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 6);

  const { error: updateError } = await supabase
    .from("creator_profiles")
    .update({
      is_pro: true,
      pro_status_source: "PROMO",
      pro_expiration_date: expirationDate.toISOString(),
      stripe_subscription_id_pro: null, // Clear any old paid sub
    })
    .eq("id", creatorProfile.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard/finances");
  return { success: true };
}
