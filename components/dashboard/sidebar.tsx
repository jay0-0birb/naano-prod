"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  Hexagon,
  ShoppingBag,
  FileText,
  Users,
  Handshake,
  AlertCircle,
  GraduationCap,
  Wallet,
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
    // Force logout with complete session clearing
    await forceLogout();
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? "bg-white/5 text-white"
        : "hover:bg-white/5 hover:text-white"
    }`;

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0A0C10] flex flex-col fixed h-full">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Hexagon className="w-6 h-6 text-blue-500 fill-blue-500/10 stroke-[1.5]" />
          <span className="font-medium text-white tracking-tight">Konex</span>
        </Link>
      </div>

      {/* Onboarding Alert */}
      {!onboardingCompleted && (
        <Link
          href="/dashboard/onboarding"
          className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 hover:bg-amber-500/20 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">Complétez votre profil</span>
        </Link>
      )}

      <nav className="flex-1 p-4 space-y-1">
        <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu
        </div>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm">Vue d'ensemble</span>
        </Link>

        {/* Creator-specific menu */}
        {isCreator ? (
          <>
            <Link
              href="/dashboard/marketplace"
              className={linkClass("/dashboard/marketplace")}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm">Marketplace</span>
            </Link>
            <Link
              href="/dashboard/applications"
              className={linkClass("/dashboard/applications")}
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">Mes candidatures</span>
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
              <span className="text-sm">Créateurs</span>
            </Link>
            <Link
              href="/dashboard/candidates"
              className={linkClass("/dashboard/candidates")}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">Candidatures</span>
            </Link>
          </>
        )}

        {/* Common menu items */}
        <Link
          href="/dashboard/collaborations"
          className={linkClass("/dashboard/collaborations")}
        >
          <Handshake className="w-5 h-5" />
          <span className="text-sm">Collaborations</span>
        </Link>

        <Link
          href="/dashboard/messages"
          className={`${linkClass("/dashboard/messages")} justify-between`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Messages</span>
          </div>
          <UnreadBadge userId={userId} />
        </Link>

        <Link
          href="/dashboard/finances"
          className={linkClass("/dashboard/finances")}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-sm">Finances</span>
        </Link>

        <Link
          href="/dashboard/academy"
          className={linkClass("/dashboard/academy")}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-sm">Academy</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard/settings"
          className={linkClass("/dashboard/settings")}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Paramètres</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
