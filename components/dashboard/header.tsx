"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/onboarding": "Complete your profile",
  "/dashboard/marketplace": "Marketplace",
  "/dashboard/applications": "My Applications",
  "/dashboard/candidates": "Applications Received",
  "/dashboard/collaborations": "Collaborations",
  "/dashboard/messages": "Messages",
  "/dashboard/settings": "Settings",
  "/dashboard/finances": "Finances",
  "/dashboard/academy": "Academy",
  "/dashboard/analytics": "Analytics & Leads",
};

export default function DashboardHeader({ userName, avatarUrl }: HeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Dashboard";

  // Get initials from name
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between px-8 font-[var(--font-jakarta)]">
      <h1 className="text-lg font-semibold text-[#111827]">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#64748B]">{userName}</span>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">{initials}</span>
          </div>
        )}
      </div>
    </header>
  );
}
