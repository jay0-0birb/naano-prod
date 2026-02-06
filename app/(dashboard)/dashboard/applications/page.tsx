import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import ApplicationActions from "@/components/applications/application-actions";

export default async function ApplicationsPage() {
  const t = await getTranslations("applications");
  const STATUS_CONFIG = {
    pending: {
      label: t("pending"),
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    accepted: {
      label: t("accepted"),
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    rejected: {
      label: t("rejected"),
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  // Only creators should access this page
  if (profile?.role !== "influencer") {
    redirect("/dashboard");
  }

  // Get creator profile
  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Get applications with SaaS company details
  let applications: any[] = [];
  if (creatorProfile?.id) {
    const { data } = await supabase
      .from("applications")
      .select(
        `
      *,
      saas_companies:saas_id (
        id,
        company_name,
        logo_url,
        industry,
        website
      )
    `,
      )
      .eq("creator_id", creatorProfile.id)
      .order("created_at", { ascending: false });

    applications = data || [];
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#111827] mb-1">
          {t("myApplications")}
        </h2>
        <p className="text-[#64748B] text-sm">
          {t("trackStatus")}
        </p>
      </div>

      {/* Applications List */}
      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => {
            const status =
              STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status.icon;
            const company = application.saas_companies;

            return (
              <div
                key={application.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {company?.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.company_name}
                        className="w-14 h-14 rounded-full object-contain border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-[#3B82F6]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#111827] text-lg">
                          {company?.company_name}
                        </h3>
                        {company?.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#94A3B8] hover:text-[#111827] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#64748B]">
                          {company?.industry}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bg} ${status.border} border`}
                  >
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Message Preview */}
                {application.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-[#64748B] line-clamp-2">
                      {application.message}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-[#94A3B8]">
                    {t("sentOn", { date: formatDate(application.created_at) })}
                  </span>

                  <div className="flex items-center gap-3">
                    {application.status === "pending" && (
                      <ApplicationActions
                        applicationId={application.id}
                        initialStatus={application.status}
                      />
                    )}
                    {application.status === "accepted" && (
                      <Link
                        href="/dashboard/collaborations"
                        className="text-sm text-[#3B82F6] hover:text-[#1D4ED8] transition-colors"
                      >
                        {t("viewCollaboration")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {t("noApplications")}
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto mb-6">
            {t("noApplicationsDesc")}
          </p>
          <Link
            href="/dashboard/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#020617] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("exploreMarketplace")}
          </Link>
        </div>
      )}
    </div>
  );
}
