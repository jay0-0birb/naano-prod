import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export default async function AcademyPage() {
  const supabase = await createClient();
  const t = await getTranslations("academy");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  const resources = [
    {
      title: t("linkedInTraining"),
      href: "https://docs.google.com/document/d/1lxe3uPjtjmb1eqS7nEvBsyhsRw98gHEUVRoGYYmtA0Y/edit?usp=sharing$",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          {t("subtitle")}
        </p>
      </div>

      <ul className="space-y-3">
        {resources.map((resource) => (
          <li key={resource.href}>
            <Link
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#111827] shadow-sm hover:bg-slate-50 hover:shadow transition-colors"
            >
              <span>{resource.title}</span>
              <span className="text-xs font-normal text-[#94A3B8]">
                {t("opensInNewTab")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
