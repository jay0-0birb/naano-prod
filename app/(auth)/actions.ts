"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as "saas" | "influencer";

  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3002";

  const supabase = await createClient();

  // 1. Sign up user
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Sign out so the user has no session until they verify via the email link.
  // This way "Sign in" shows the login form instead of redirecting to dashboard.
  await supabase.auth.signOut();

  return { success: true, message: "Check email to continue sign in process" };
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resendConfirmationEmail(email: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const { headers } = await import("next/headers");

  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3002";
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function sendPasswordResetEmail(email: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const { headers } = await import("next/headers");

  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3002";
  const supabase = await createClient();

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/dashboard/settings/change-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return { error: error.message };
  return { success: true };
}
