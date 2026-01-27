import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  FileText,
  Users,
  Handshake,
  Wallet,
} from "lucide-react";

export default async function DashboardPage() {
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

  if (!profile?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  const isCreator = profile?.role === "influencer";

  // Fetch basic stats
  let stats = { collaborations: 0, pending: 0 };

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

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#111827] mb-2">
        Welcome back, {profile?.full_name?.split(" ")[0] || "User"} 👋
      </h2>
      <p className="text-[#64748B] mb-8">
        {isCreator
          ? "Discover SaaS opportunities and grow your partnerships."
          : "Manage applications and collaborations with creators."}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[#64748B] text-sm mb-1">
            {isCreator ? "Pending Applications" : "Applications Received"}
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-[#64748B] text-sm mb-1">
            Active Collaborations
          </div>
          <div className="text-3xl font-bold text-[#111827]">
            {stats.collaborations}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-[#111827] mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCreator ? (
          <>
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
                      Explore Marketplace
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      Discover SaaS companies
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
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
                      My Applications
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      Track your applications
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
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
                      My Finances
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      Commissions and payments
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
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
                      View Applications
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      {stats.pending} pending
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
                      Collaborations
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      Manage partnerships
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
                      Finances & Plans
                    </h4>
                    <p className="text-sm text-[#64748B]">
                      Manage subscription
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
