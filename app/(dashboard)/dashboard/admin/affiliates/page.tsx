import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAffiliateReport } from "@/lib/affiliate-report";
import AffiliatesAdminClient from "./affiliates-client";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    code?: string;
  }>;
}

export default async function AdminAffiliatesPage({ searchParams }: PageProps) {
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

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const codeFilter = params.code?.trim() || null;

  const [codes, report] = await Promise.all([
    supabase
      .from("affiliate_codes")
      .select("code, referrer_name, created_at")
      .order("code"),
    getAffiliateReport(
      Number.isNaN(year) ? now.getFullYear() : year,
      Number.isNaN(month) ? now.getMonth() + 1 : month,
      codeFilter
    ),
  ]);

  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <AffiliatesAdminClient
        codes={codes.data ?? []}
        report={report}
        currentYear={Number.isNaN(year) ? now.getFullYear() : year}
        currentMonth={Number.isNaN(month) ? now.getMonth() + 1 : month}
        codeFilter={codeFilter ?? ""}
      />
    </Suspense>
  );
}
