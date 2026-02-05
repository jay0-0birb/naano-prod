"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/marketing/navbar";
import { FooterSection } from "@/components/marketing/footer-section";
import { Mail, Linkedin } from "lucide-react";

const SUPPORT_EMAIL = "info@naano.xyz";
const LINKEDIN_URL = "https://www.linkedin.com/company/naanooo/";

export default function HelpPage() {
  const t = useTranslations("help");

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <Navbar showContent={true} />

      <section className="pt-32 sm:pt-36 md:pt-44 pb-16 sm:pb-20 px-4 sm:px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[32px] sm:text-[40px] md:text-[52px] font-bold text-[#111827] tracking-[-0.03em] leading-[1.1] mb-4"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <section className="pt-4 sm:pt-6 pb-24 sm:pb-36 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="py-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#3B82F6]">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {t("contactHeading")}
              </h2>
            </div>
            <p className="text-[#4B5563] leading-relaxed text-lg">
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
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-center"
          >
            <Link
              href="/"
              className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
            >
              ← {t("backToHome")}
            </Link>
          </motion.div>
        </div>
      </section>

      <FooterSection compact />
    </main>
  );
}
