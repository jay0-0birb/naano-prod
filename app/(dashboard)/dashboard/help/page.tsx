"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Linkedin } from "lucide-react";

const SUPPORT_EMAIL = "info@naano.xyz";
const LINKEDIN_URL = "https://www.linkedin.com/company/naanooo/";

export default function DashboardHelpPage() {
  const t = useTranslations("help");

  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <section className="pb-6">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight mb-2"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-[#64748B]"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <section className="pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 sm:p-6 rounded-xl border border-gray-200 bg-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#3B82F6]">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">
              {t("contactHeading")}
            </h2>
          </div>
          <p className="text-[#4B5563] leading-relaxed">
            {t("contactBeforeEmail")}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[#3B82F6] hover:text-[#2563EB] font-medium underline"
            >
              {SUPPORT_EMAIL}
            </a>
            {t("contactAfterEmail")}
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#3B82F6] hover:text-[#2563EB] font-medium underline"
            >
              {t("linkedin")}
              <Linkedin className="w-4 h-4" />
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6"
        >
          <Link
            href="/dashboard"
            className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
          >
            ← {t("backToDashboard")}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
