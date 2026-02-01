import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Handshake,
  MessageSquare,
  Building2,
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

export default async function CollaborationsPage() {
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

  if (!profile?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  const isCreator = profile?.role === "influencer";

  // Get collaborations based on role
  let collaborations: any[] = [];

  if (isCreator) {
    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (creatorProfile) {
      const { data } = await supabase
        .from("collaborations")
        .select(
          `
          *,
          applications:application_id (
            id,
            message,
            saas_companies:saas_id (
              id,
              company_name,
              logo_url,
              industry,
              website,
              profiles:profile_id (
                full_name
              )
            )
          ),
          conversations (
            id
          )
        `,
        )
        .eq("applications.creator_id", creatorProfile.id)
        .order("created_at", { ascending: false });

      collaborations = data?.filter((c) => c.applications) || [];
    }
  } else {
    // Get SaaS company
    const { data: saasCompany } = await supabase
      .from("saas_companies")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (saasCompany) {
      const { data } = await supabase
        .from("collaborations")
        .select(
          `
          *,
          applications:application_id (
            id,
            message,
            creator_profiles:creator_id (
              id,
              bio,
              linkedin_url,
              followers_count,
              profiles:profile_id (
                full_name,
                avatar_url
              )
            )
          ),
          conversations (
            id
          )
        `,
        )
        .eq("applications.saas_id", saasCompany.id)
        .order("created_at", { ascending: false });

      collaborations = data?.filter((c) => c.applications) || [];
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
          Collaborations
        </h2>
        <p className="text-[#64748B] text-sm">
          {isCreator
            ? "Manage your partnerships with SaaS companies"
            : "Manage your partnerships with creators"}
        </p>
        {isCreator && (
          <p className="text-xs text-[#64748B] mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
            Limite : 25 posts au total (toutes collaborations confondues).
          </p>
        )}
      </div>

      {/* Collaborations List */}
      {collaborations.length > 0 ? (
        <div className="space-y-4">
          {collaborations.map((collab) => {
            const status =
              STATUS_CONFIG[collab.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status.icon;
            const app = collab.applications;
            const partner = isCreator
              ? app?.saas_companies
              : app?.creator_profiles;
            const partnerProfile = isCreator
              ? partner?.profiles
              : partner?.profiles;
            const conversation = collab.conversations?.[0];

            return (
              <div
                key={collab.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Partner Avatar/Logo */}
                    {isCreator ? (
                      partner?.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.company_name}
                          className="w-14 h-14 rounded-full object-contain border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-[#3B82F6]" />
                        </div>
                      )
                    ) : partnerProfile?.avatar_url ? (
                      <img
                        src={partnerProfile.avatar_url}
                        alt={partnerProfile.full_name}
                        className="w-14 h-14 rounded-full object-contain border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
                        <Users className="w-7 h-7 text-blue-500" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#111827] text-lg">
                          {isCreator
                            ? partner?.company_name
                            : partnerProfile?.full_name}
                        </h3>
                        {isCreator && partner?.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#94A3B8] hover:text-[#111827] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {isCreator ? (
                          <>
                            <span className="text-xs text-[#64748B]">
                              {partner?.industry}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#64748B]">
                            {partner?.followers_count?.toLocaleString()}{" "}
                            followers
                          </span>
                        )}
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

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-[#64748B]">
                    Collaboration started on {formatDate(collab.started_at)}
                  </span>

                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/collaborations/${collab.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View posts
                    </Link>
                    {conversation && (
                      <Link
                        href={`/dashboard/messages?conversation=${conversation.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#64748B] hover:text-[#111827] rounded-lg text-sm font-medium transition-colors border border-gray-200"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Messages
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
            <Handshake className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            No collaborations
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto mb-6">
            {isCreator
              ? "You don't have any active collaborations yet. Apply to SaaS companies!"
              : "You don't have any active collaborations yet. Accept creator applications!"}
          </p>
          <Link
            href={
              isCreator ? "/dashboard/marketplace" : "/dashboard/candidates"
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isCreator ? "Explore Marketplace" : "View Applications"}
          </Link>
        </div>
      )}
    </div>
  );
}
