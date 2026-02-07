"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { LocaleToggle } from "@/components/ui/locale-toggle";

interface HeaderProps {
  userName: string;
  avatarUrl?: string | null;
  onMenuClick?: () => void;
}

const PAGE_KEYS: Record<string, string> = {
  "/dashboard": "overview",
  "/dashboard/onboarding": "completeProfile",
  "/dashboard/marketplace": "marketplace",
  "/dashboard/applications": "myApplications",
  "/dashboard/candidates": "applicationsReceived",
  "/dashboard/collaborations": "collaborations",
  "/dashboard/messages": "messages",
  "/dashboard/settings": "settings",
  "/dashboard/finances": "finances",
  "/dashboard/academy": "academy",
  "/dashboard/analytics": "analyticsLeads",
};

export default function DashboardHeader({
  userName,
  avatarUrl,
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("header");
  const key = PAGE_KEYS[pathname] || "dashboard";
  const title = t(key);

  // Get initials from name
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className="h-14 sm:h-16 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Open menu"
            className="md:hidden shrink-0 p-2 -ml-1 rounded-lg text-[#64748B] hover:bg-gray-100 hover:text-[#111827]"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base sm:text-lg font-semibold text-[#111827] truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <LocaleToggle />
        <span className="text-sm text-[#64748B] truncate max-w-[80px] sm:max-w-[140px] md:max-w-none">
          {userName}
        </span>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border border-gray-200 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-blue-600">
              {initials}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
