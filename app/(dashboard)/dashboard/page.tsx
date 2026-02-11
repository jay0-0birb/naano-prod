import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  ShoppingBag,
  FileText,
  Users,
  Handshake,
  Wallet,
  Settings,
} from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile first (needed for role check)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  const isCreator = profile?.role === "influencer";
  const onboardingIncomplete = !profile?.onboarding_completed;
  const creatorProfileLocked = isCreator && onboardingIncomplete;
  const saasProfileLocked = !isCreator && onboardingIncomplete;

  // Fetch basic stats
  const stats = { collaborations: 0, pending: 0 };

  if (isCreator) {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (creatorProfile) {
      const [applicationsResult, collaborationsResult] = await Promise.all([
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", creatorProfile.id)
          .eq("status", "pending"),
        supabase
          .from("collaborations")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      stats.pending = applicationsResult.count || 0;
      stats.collaborations = collaborationsResult.count || 0;
    }
  } else {
    const { data: saasCompany } = await supabase
      .from("saas_companies")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (saasCompany) {
      const [candidatesResult, collaborationsResult] = await Promise.all([
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("saas_id", saasCompany.id)
          .eq("status", "pending"),
        supabase
          .from("collaborations")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      stats.pending = candidatesResult.count || 0;
      stats.collaborations = collaborationsResult.count || 0;
    }
  }

  const firstName = profile?.full_name?.split(" ")[0] || "User";

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#111827] mb-2">
        {t("welcomeBack", { name: firstName })}
      </h2>
      <p className="text-[#64748B] mb-8">
        {isCreator ? t("creatorSubtitle") : t("saasSubtitle")}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[#64748B] text-sm mb-1">
            {isCreator ? t("pendingApplications") : t("applicationsReceived")}
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[#64748B] text-sm mb-1">
            {t("activeCollaborations")}
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {stats.collaborations}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-[#111827] mb-4">
        {t("quickActions")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCreator ? (
          <>
            {creatorProfileLocked ? (
              <div
                className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                title={t("completeProfileToUnlock")}
                aria-disabled="true"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-500">
                        {t("exploreMarketplace")}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {t("discoverSaaS")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/marketplace"
                className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">
                        {t("exploreMarketplace")}
                      </h4>
                      <p className="text-sm text-[#64748B]">
                        {t("discoverSaaS")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}
            {creatorProfileLocked ? (
              <div
                className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                title={t("completeProfileToUnlock")}
                aria-disabled="true"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-500">
                        {t("myApplications")}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {t("trackApplications")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/applications"
                className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#8B5CF6] hover:bg-purple-50/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">
                        {t("myApplications")}
                      </h4>
                      <p className="text-sm text-[#64748B]">
                        {t("trackApplications")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}
            {creatorProfileLocked ? (
              <div
                className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                title={t("completeProfileToUnlock")}
                aria-disabled="true"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-500">
                        {t("myFinances")}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {t("commissionsPayments")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/finances"
                className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#10B981] hover:bg-green-50/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">
                        {t("myFinances")}
                      </h4>
                      <p className="text-sm text-[#64748B]">
                        {t("commissionsPayments")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}
            {creatorProfileLocked && (
              <Link
                href="/dashboard/onboarding"
                className="group p-6 rounded-2xl border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">
                        {t("completeProfile")}
                      </h4>
                      <p className="text-sm text-red-700">
                        {t("completeProfileToUnlock")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}
          </>
        ) : (
          <>
            {saasProfileLocked ? (
              <>
                {/* Same layout as unlocked SaaS overview, but greyed out and non-clickable */}
                <div
                  className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                  title={t("completeProfileToUnlock")}
                  aria-disabled="true"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-500">
                          {t("viewApplications")}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {t("pendingCount", { count: stats.pending })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
                <div
                  className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                  title={t("completeProfileToUnlock")}
                  aria-disabled="true"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                        <Handshake className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-500">
                          {t("collaborations")}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {t("managePartnerships")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
                <div
                  className="p-6 rounded-2xl border border-gray-200 bg-gray-50 cursor-not-allowed select-none opacity-75"
                  title={t("completeProfileToUnlock")}
                  aria-disabled="true"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-500">
                          {t("financesPlans")}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {t("manageSubscription")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/candidates"
                  className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#3B82F6]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#111827]">
                          {t("viewApplications")}
                        </h4>
                        <p className="text-sm text-[#64748B]">
                          {t("pendingCount", { count: stats.pending })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link
                  href="/dashboard/collaborations"
                  className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#10B981] hover:bg-green-50/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                        <Handshake className="w-6 h-6 text-[#10B981]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#111827]">
                          {t("collaborations")}
                        </h4>
                        <p className="text-sm text-[#64748B]">
                          {t("managePartnerships")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link
                  href="/dashboard/finances"
                  className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#F59E0B] hover:bg-amber-50/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-[#F59E0B]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#111827]">
                          {t("financesPlans")}
                        </h4>
                        <p className="text-sm text-[#64748B]">
                          {t("manageSubscription")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </>
            )}
            {onboardingIncomplete && (
              <Link
                href="/dashboard/onboarding"
                className="group p-6 rounded-2xl border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">
                        {t("completeProfile")}
                      </h4>
                      <p className="text-sm text-red-700">
                        {t("completeProfileToUnlock")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
