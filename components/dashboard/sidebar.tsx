"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  ExternalLink,
  X,
  HelpCircle,
} from "lucide-react";
import { forceLogout } from "@/lib/auth-utils";
import UnreadBadge from "./unread-badge";

interface SidebarProps {
  role: string;
  onboardingCompleted: boolean;
  userId: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({
  role,
  onboardingCompleted,
  userId,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const isCreator = role === "influencer";
  const creatorProfileLocked = isCreator && !onboardingCompleted;

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

  const disabledLinkClass =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed select-none";

  const handleNav = () => {
    onClose?.();
  };

  return (
    <aside
      className={`
        w-64 border-r border-gray-200 bg-white flex flex-col fixed h-full z-40
        transform transition-transform duration-200 ease-out
        -translate-x-full md:translate-x-0
        ${mobileOpen ? "translate-x-0" : ""}
      `}
      style={{ fontFamily: "Satoshi, sans-serif" }}
      aria-hidden={!mobileOpen}
    >
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={handleNav}
        >
          <img
            src="/logo.svg"
            alt="naano"
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">
            naano
          </span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-gray-100 hover:text-[#111827]"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Onboarding Alert */}
      {!onboardingCompleted && (
        <Link
          href="/dashboard/onboarding"
          className="mx-4 mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-700 font-medium">
            {t("completeProfile")}
          </span>
        </Link>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-2 py-2 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          {t("menu")}
        </div>

        <Link
          href="/dashboard"
          className={linkClass("/dashboard")}
          onClick={handleNav}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t("overview")}</span>
        </Link>

        {/* Creator-specific menu */}
        {isCreator ? (
          <>
            {creatorProfileLocked ? (
              <span
                className={disabledLinkClass}
                title={t("completeProfileToUnlock")}
                aria-disabled="true"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{t("marketplace")}</span>
              </span>
            ) : (
              <Link
                href="/dashboard/marketplace"
                className={linkClass("/dashboard/marketplace")}
                onClick={handleNav}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{t("marketplace")}</span>
              </Link>
            )}
            {creatorProfileLocked ? (
              <span
                className={disabledLinkClass}
                title={t("completeProfileToUnlock")}
                aria-disabled="true"
              >
                <FileText className="w-5 h-5" />
                <span>{t("myApplications")}</span>
              </span>
            ) : (
              <Link
                href="/dashboard/applications"
                className={linkClass("/dashboard/applications")}
                onClick={handleNav}
              >
                <FileText className="w-5 h-5" />
                <span>{t("myApplications")}</span>
              </Link>
            )}
          </>
        ) : (
          /* SaaS-specific menu */
          <>
            <Link
              href="/dashboard/marketplace"
              className={linkClass("/dashboard/marketplace")}
              onClick={handleNav}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{t("creators")}</span>
            </Link>
            <Link
              href="/dashboard/candidates"
              className={linkClass("/dashboard/candidates")}
              onClick={handleNav}
            >
              <Users className="w-5 h-5" />
              <span>{t("applications")}</span>
            </Link>
          </>
        )}

        {/* Common menu items */}
        {creatorProfileLocked ? (
          <span
            className={disabledLinkClass}
            title={t("completeProfileToUnlock")}
            aria-disabled="true"
          >
            <Handshake className="w-5 h-5" />
            <span>{t("collaborations")}</span>
          </span>
        ) : (
          <Link
            href="/dashboard/collaborations"
            className={linkClass("/dashboard/collaborations")}
            onClick={handleNav}
          >
            <Handshake className="w-5 h-5" />
            <span>{t("collaborations")}</span>
          </Link>
        )}

        {creatorProfileLocked ? (
          <span
            className={`${disabledLinkClass} justify-between`}
            title={t("completeProfileToUnlock")}
            aria-disabled="true"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <span>{t("messages")}</span>
            </div>
            <UnreadBadge userId={userId} />
          </span>
        ) : (
          <Link
            href="/dashboard/messages"
            className={`${linkClass("/dashboard/messages")} justify-between`}
            onClick={handleNav}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <span>{t("messages")}</span>
            </div>
            <UnreadBadge userId={userId} />
          </Link>
        )}

        {creatorProfileLocked ? (
          <span
            className={disabledLinkClass}
            title={t("completeProfileToUnlock")}
            aria-disabled="true"
          >
            <Wallet className="w-5 h-5" />
            <span>{t("finances")}</span>
          </span>
        ) : (
          <Link
            href="/dashboard/finances"
            className={linkClass("/dashboard/finances")}
            onClick={handleNav}
          >
            <Wallet className="w-5 h-5" />
            <span>{t("finances")}</span>
          </Link>
        )}

        {/* SaaS-only: Global Analytics & Leads */}
        {!isCreator && (
          <Link
            href="/dashboard/analytics"
            className={linkClass("/dashboard/analytics")}
            onClick={handleNav}
          >
            <BarChart3 className="w-5 h-5" />
            <span>{t("analyticsLeads")}</span>
          </Link>
        )}

        {/* Creator-only: Academy */}
        {isCreator &&
          (creatorProfileLocked ? (
            <span
              className={disabledLinkClass}
              title={t("completeProfileToUnlock")}
              aria-disabled="true"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="flex items-center gap-1">
                {t("academy")}
                <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
              </span>
            </span>
          ) : (
            <Link
              href="/dashboard/academy"
              className={linkClass("/dashboard/academy")}
              onClick={handleNav}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="flex items-center gap-1">
                {t("academy")}
                <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
              </span>
            </Link>
          ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/dashboard/help"
          className={linkClass("/dashboard/help")}
          onClick={handleNav}
        >
          <HelpCircle className="w-5 h-5" />
          <span>{t("helpCenter")}</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className={linkClass("/dashboard/settings")}
          onClick={handleNav}
        >
          <Settings className="w-5 h-5" />
          <span>{t("settings")}</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-1 text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("signOut")}</span>
        </button>
      </div>
    </aside>
  );
}
