"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateAffiliateCodeResult =
  | { success: true }
  | { success: false; error: string };

export async function createAffiliateCode(
  code: string,
  referrerName: string
): Promise<CreateAffiliateCodeResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, error: "Accès refusé" };
  }

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { success: false, error: "Code requis" };
  if (!referrerName.trim()) return { success: false, error: "Nom de l'apporteur requis" };

  const { error } = await supabase.from("affiliate_codes").insert({
    code: trimmed,
    referrer_name: referrerName.trim(),
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "Ce code existe déjà" };
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/affiliates");
  return { success: true };
}
