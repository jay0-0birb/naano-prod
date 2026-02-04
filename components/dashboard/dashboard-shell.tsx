"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";

interface DashboardShellProps {
  role: string;
  onboardingCompleted: boolean;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}

export default function DashboardShell({
  role,
  onboardingCompleted,
  userId,
  userName,
  avatarUrl,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <DashboardSidebar
        role={role}
        onboardingCompleted={onboardingCompleted}
        userId={userId}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      {/* Backdrop on mobile when menu is open */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <main className="flex-1 min-w-0 ml-0 md:ml-64 overflow-x-hidden">
        <DashboardHeader
          userName={userName}
          avatarUrl={avatarUrl}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <div className="p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </>
  );
}
