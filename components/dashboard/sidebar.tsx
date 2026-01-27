"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  ShoppingBag,
  FileText,
  Users,
  Handshake,
  AlertCircle,
  GraduationCap,
  Wallet,
  BarChart3,
} from "lucide-react";
import { forceLogout } from "@/lib/auth-utils";
import UnreadBadge from "./unread-badge";

interface SidebarProps {
  role: string;
  onboardingCompleted: boolean;
  userId: string;
}

export default function DashboardSidebar({
  role,
  onboardingCompleted,
  userId,
}: SidebarProps) {
  const pathname = usePathname();
  const isCreator = role === "influencer";

  const handleSignOut = async () => {
    await forceLogout();
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
      isActive(path)
        ? "bg-[#0F172A] text-white font-medium"
        : "text-[#64748B] hover:bg-gray-50 hover:text-[#111827]"
    }`;

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col fixed h-full font-[var(--font-jakarta)]">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">
            Naano
          </span>
        </Link>
      </div>

      {/* Onboarding Alert */}
      {!onboardingCompleted && (
        <Link
          href="/dashboard/onboarding"
          className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 font-medium">
            Complete your profile
          </span>
        </Link>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-2 py-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Menu
        </div>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </Link>

        {/* Creator-specific menu */}
        {isCreator ? (
          <>
            <Link
              href="/dashboard/marketplace"
              className={linkClass("/dashboard/marketplace")}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Marketplace</span>
            </Link>
            <Link
              href="/dashboard/applications"
              className={linkClass("/dashboard/applications")}
            >
              <FileText className="w-5 h-5" />
              <span>My Applications</span>
            </Link>
          </>
        ) : (
          /* SaaS-specific menu */
          <>
            <Link
              href="/dashboard/marketplace"
              className={linkClass("/dashboard/marketplace")}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Creators</span>
            </Link>
            <Link
              href="/dashboard/candidates"
              className={linkClass("/dashboard/candidates")}
            >
              <Users className="w-5 h-5" />
              <span>Applications</span>
            </Link>
          </>
        )}

        {/* Common menu items */}
        <Link
          href="/dashboard/collaborations"
          className={linkClass("/dashboard/collaborations")}
        >
          <Handshake className="w-5 h-5" />
          <span>Collaborations</span>
        </Link>

        <Link
          href="/dashboard/messages"
          className={`${linkClass("/dashboard/messages")} justify-between`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </div>
          <UnreadBadge userId={userId} />
        </Link>

        <Link
          href="/dashboard/finances"
          className={linkClass("/dashboard/finances")}
        >
          <Wallet className="w-5 h-5" />
          <span>Finances</span>
        </Link>

        {/* SaaS-only: Global Analytics & Leads */}
        {!isCreator && (
          <Link
            href="/dashboard/analytics"
            className={linkClass("/dashboard/analytics")}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics & Leads</span>
          </Link>
        )}

        {/* Creator-only: Academy */}
        {isCreator && (
          <Link
            href="/dashboard/academy"
            className={linkClass("/dashboard/academy")}
          >
            <GraduationCap className="w-5 h-5" />
            <span>Academy</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/dashboard/settings"
          className={linkClass("/dashboard/settings")}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-1 text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
