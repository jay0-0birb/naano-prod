import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Building2, Users } from "lucide-react";
import SaasOnboardingForm from "@/components/onboarding/saas-onboarding-form";
import CreatorOnboardingForm from "@/components/onboarding/creator-onboarding-form";

export default async function OnboardingPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role and onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Admins never see onboarding; send them to dashboard (then to admin/affiliates)
  if (profile?.role === "admin") {
    redirect("/dashboard");
  }

  const isCreator = profile?.role === "influencer";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ fontFamily: 'Satoshi, sans-serif' }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Naano
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              isCreator
                ? "bg-purple-50 border border-purple-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {isCreator ? (
              <>
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">
                  {t("creatorProfile")}
                </span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  {t("companyProfile")}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            {t("completeProfile")}
          </h1>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {isCreator
              ? t("creatorOnboardingDesc")
              : t("saasOnboardingDesc")}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {isCreator ? <CreatorOnboardingForm /> : <SaasOnboardingForm />}
        </div>
      </div>
    </div>
  );
}
