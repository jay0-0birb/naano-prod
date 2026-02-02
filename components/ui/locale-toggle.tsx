"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: "en" | "fr") => {
    if (newLocale === locale) return;
    startTransition(async () => {
      await fetch(`/api/locale?locale=${newLocale}`);
      router.refresh();
    });
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5"
      role="group"
      aria-label="Switch language"
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
          locale === "en"
            ? "bg-white text-[#111827] shadow-sm"
            : "text-[#64748B] hover:text-[#111827]"
        }`}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => switchLocale("fr")}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
          locale === "fr"
            ? "bg-white text-[#111827] shadow-sm"
            : "text-[#64748B] hover:text-[#111827]"
        }`}
      >
        FR
      </button>
    </div>
  );
}
