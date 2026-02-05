import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/settings/change-password-form";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-5xl">
      <ChangePasswordForm />
    </div>
  );
}
