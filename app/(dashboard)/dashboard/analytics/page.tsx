import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getGlobalAnalytics, getGlobalLeads } from "./actions";
import GlobalAnalyticsTab from "./analytics-tab";
import GlobalLeadFeedTab from "./lead-feed-tab";

export default async function GlobalAnalyticsPage() {
  const t = await getTranslations("analytics");
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
    <div className="max-w-7xl w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">
          {t("title")}
        </h1>
        <p className="text-[#64748B] text-sm">{t("subtitle")}</p>
      </div>

      <GlobalAnalyticsTab />
      <div className="mt-8 w-full min-w-0 overflow-x-hidden">
        <GlobalLeadFeedTab />
      </div>
    </div>
  );
}
