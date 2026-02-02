"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/marketing/navbar";
import { FooterSection } from "@/components/marketing/footer-section";
import {
  Target,
  Zap,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("about");
  const tCommon = useTranslations("common");

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <Navbar showContent={true} />

      {/* Hero - pt clears fixed navbar (naano + menu + toggle) */}
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

      {/* Content */}
      <section className="pt-20 sm:pt-28 pb-24 sm:pb-36 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Section 1: About Us intro (heading removed, paragraphs kept) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
            style={{ marginBottom: "2rem" }}
          >
            <div className="space-y-4 text-[#4B5563] leading-relaxed">
              <p>{t("section1P1")}</p>
              <p>{t("section1P2")}</p>
              <p>{t("section1P3")}</p>
            </div>
          </motion.div>

          {/* Section 2: Our Mission */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
            style={{ marginBottom: "2rem" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#3B82F6]">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {t("section2Title")}
              </h2>
            </div>
            <div className="space-y-4 text-[#4B5563] leading-relaxed">
              <p>{t("section2P1")}</p>
              <p>{t("section2P2")}</p>
            </div>
          </motion.div>

          {/* Section 3: Built on Proven Results */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
            style={{ marginBottom: "4rem" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {t("section3Title")}
              </h2>
            </div>
            <div className="space-y-4 text-[#4B5563] leading-relaxed">
              <p>{t("section3P1")}</p>
              <p>{t("section3P2")}</p>
              <ul className="space-y-2 pl-4 border-l-2 border-blue-200">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  {t("section3Bullet1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  {t("section3Bullet2")}
                </li>
              </ul>
              <p>{t("section3P3")}</p>
            </div>
          </motion.div>

          {/* Section 4: Why Naano */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
            style={{ marginBottom: "2rem" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {t("section4Title")}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6" style={{ marginTop: "2rem" }}>
              {/* For Brands */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3B82F6]" />
                  {t("section4ForBrands")}
                </h3>
                <ul className="space-y-3 text-[#4B5563] text-sm leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-[#3B82F6] mt-1">•</span>
                    {t("section4Brand1")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#3B82F6] mt-1">•</span>
                    {t("section4Brand2")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#3B82F6] mt-1">•</span>
                    {t("section4Brand3")}
                  </li>
                </ul>
              </div>

              {/* For Creators */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  {t("section4ForCreators")}
                </h3>
                <ul className="space-y-3 text-[#4B5563] text-sm leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {t("section4Creator1")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {t("section4Creator2")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {t("section4Creator3")}
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Section 5: The Future */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-[#0F172A] p-8 sm:p-10 text-center"
            style={{ marginBottom: "4rem" }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              {t("section5Title")}
            </h2>
            <p className="text-white/80 text-lg mb-6">{t("section5P1")}</p>
            <p className="text-white font-semibold text-lg">{t("section5P2")}</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-white text-[#0F172A] font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              {tCommon("getStarted")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <FooterSection compact />
    </main>
  );
}