import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getGlobalAnalytics, getGlobalLeads } from "./actions";
import GlobalAnalyticsTab from "./analytics-tab";
import GlobalLeadFeedTab from "./lead-feed-tab";

export default async function GlobalAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Only SaaS can access this page
  if (profile?.role !== "saas") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">
          Analytics &amp; Leads globaux
        </h1>
        <p className="text-[#64748B] text-sm">
          Vue d&apos;ensemble de toutes vos collaborations — Analytics et Lead
          Feed agrégés.
        </p>
      </div>

      <GlobalAnalyticsTab />
      <div className="mt-8">
        <GlobalLeadFeedTab />
      </div>
    </div>
  );
}

