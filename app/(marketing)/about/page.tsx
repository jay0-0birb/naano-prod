"use client";

import Link from "next/link";
import Image from "next/image";
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
import juImage from "../../../docs/ju.jpeg";
import alexImage from "../../../docs/alex.png";
import tomImage from "../../../docs/tom.png";

export default function AboutPage() {
  const t = useTranslations("about");
  const tCommon = useTranslations("common");

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <Navbar showContent={true} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Hero - pt clears fixed navbar (naano + menu + toggle) */}
        {/* Reduced vertical padding so content appears sooner on page load */}
        <section className="pt-24 sm:pt-28 md:pt-32 pb-6 sm:pb-8 px-4 sm:px-6 bg-gradient-to-b from-blue-50/50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-[32px] sm:text-[40px] md:text-[52px] font-bold text-[#111827] tracking-[-0.03em] leading-[1.1] mb-4">
              {t("title")}
            </h1>
            <p className="text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto">
              {t("subtitle")}
            </p>

            {/* Founders photos below subtitle */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:gap-6">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={juImage}
                    alt="Justine, co-founder & cto"
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-md"
                    style={{ objectPosition: "center 10%" }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#111827]">
                    Justine
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={alexImage}
                    alt="Alexis, co-founder of Naano"
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-md"
                    style={{ objectPosition: "center 0.2%" }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#111827]">
                    Alexis
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={tomImage}
                    alt="Thomas, co-founder of Naano"
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-md"
                    style={{ objectPosition: "center 10%" }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#111827]">
                    Thomas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content - reduced top padding to bring body closer to hero */}
        <section className="pt-4 sm:pt-6 pb-24 sm:pb-32 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Section 1: About Us intro (heading removed, paragraphs kept) */}
            <div className="space-y-4 mb-10 sm:mb-16">
              <div className="space-y-4 text-[#4B5563] leading-relaxed text-center max-w-2xl mx-auto">
                <p>{t("section1P1")}</p>
                <p>{t("section1P2")}</p>
                <p>{t("section1P3")}</p>
              </div>
            </div>

            {/* Section 2: Our Mission */}
            <div className="space-y-6" style={{ marginBottom: "2rem" }}>
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
            </div>

            {/* Section 3: Built on Proven Results (pushed to the right) */}
            <div className="flex justify-end mb-20" style={{ marginBottom: "4rem" }}>
              <div className="space-y-4 max-w-xl text-right">
                <div className="flex items-center gap-3 justify-end">
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

                  <div className="flex justify-end">
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
                  </div>

                  <p>{t("section3P3")}</p>
                </div>
              </div>
            </div>

            {/* Section 4: Why Naano */}
            <div className="space-y-8" style={{ marginBottom: "2rem" }}>
              <div className="flex items-center justify-center gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                  {t("section4Title")}
                </h2>
              </div>

              <div
                className="grid sm:grid-cols-2 gap-6"
                style={{ marginTop: "2rem" }}
              >
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
            </div>

            {/* Section 5: The Future */}
            <div
              className="rounded-2xl bg-[#0F172A] p-8 sm:p-10 text-center"
              style={{ marginBottom: "4rem" }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                {t("section5Title")}
              </h2>
              <p className="text-white/80 text-lg mb-6">{t("section5P1")}</p>
              <p className="text-white font-semibold text-lg">
                {t("section5P2")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-white text-[#0F172A] font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                {tCommon("getStarted")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </motion.div>

      <FooterSection compact />
    </main>
  );
}
