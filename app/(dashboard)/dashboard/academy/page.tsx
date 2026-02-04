import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AcademyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  // Academy is only for creators/influencers
  if (profile?.role !== "influencer") {
    redirect("/dashboard");
  }

  // Redirect creators directly to external Academy doc
  redirect(
    "https://docs.google.com/document/d/1lxe3uPjtjmb1eqS7nEvBsyhsRw98gHEUVRoGYYmtA0Y/edit?usp=sharing$",
  );
}
