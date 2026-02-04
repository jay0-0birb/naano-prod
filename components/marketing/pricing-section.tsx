"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Volume pricing tiers (matches credit system)
function getCreditUnitPrice(volume: number): number {
  if (volume >= 5000) return 1.6;
  if (volume >= 4000) return 1.75;
  if (volume >= 3000) return 1.85;
  if (volume >= 2500) return 1.95;
  if (volume >= 2000) return 2.05;
  if (volume >= 1750) return 2.1;
  if (volume >= 1500) return 2.15;
  if (volume >= 1250) return 2.2;
  if (volume >= 1000) return 2.25;
  if (volume >= 750) return 2.35;
  if (volume >= 500) return 2.45;
  if (volume >= 250) return 2.55;
  return 2.6;
}

export const PricingSection = () => {
  const t = useTranslations("pricing");
  const brandFeatures = [
    t("unlimitedCreators"),
    t("multiBrandDashboard"),
    t("qualifiedLinksAnalytics"),
  ];
  const [activeTab, setActiveTab] = useState<"saas" | "creators">("saas");
  const [creditVolume, setCreditVolume] = useState(1000);
  const [unitPrice, setUnitPrice] = useState(2.25);
  const [totalPrice, setTotalPrice] = useState(2250);

  useEffect(() => {
    const price = getCreditUnitPrice(creditVolume);
    setUnitPrice(price);
    setTotalPrice(price * creditVolume);
  }, [creditVolume]);

  const roundToStep = (value: number, step = 50) =>
    Math.round(value / step) * step;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreditVolume(roundToStep(parseInt(e.target.value), 50));
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white relative">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col text-center mb-10 sm:mb-12">
          <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
            {t("badge")}
          </span>
          <h2
            className="text-[28px] sm:text-[36px] md:text-[44px] font-bold text-[#0F172A] tracking-[-0.03em] leading-[1.1] mb-3 sm:mb-4"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("title")}
          </h2>
          <p
            className="text-lg text-[#64748B] max-w-[600px] mx-auto"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("subtitle")}
          </p>

          {/* Toggle */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-full mt-6 w-fit mx-auto">
            {["saas", "creators"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "saas" | "creators")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-[#0F172A] bg-white shadow-sm"
                      : "text-[#64748B] bg-transparent"
                  } hover:text-[#0F172A]`}
                >
                  {tab === "saas" ? t("forBrands") : t("forCreators")}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "saas" ? (
            <motion.div
              key="saas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-[560px] mx-auto"
            >
              <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#0F172A] shadow-sm">
                {/* Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-[#0F172A]">
                      {t("monthlyCredits")}
                    </label>
                    <span className="text-xl font-bold text-[#0F172A]">
                      {creditVolume.toLocaleString()} {t("credits")}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={creditVolume}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
                  />

                  <div className="flex justify-between text-xs text-[#94A3B8] mt-2">
                    <span>100</span>
                    <span>2,500</span>
                    <span>5,000+</span>
                  </div>
                </div>

                {/* Price display */}
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#64748B]">
                      {t("unitPrice")}
                    </span>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      €{unitPrice.toFixed(2)} {t("perCredit")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                    <span className="text-base font-semibold text-[#0F172A]">
                      {t("totalMonthly")}
                    </span>
                    <span className="text-2xl font-bold text-[#0F172A]">
                      €{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-3 mb-6">
                  {brandFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check
                        className="w-4 h-4 text-[#10B981] flex-shrink-0"
                        strokeWidth={2.5}
                      />
                      <p className="text-sm text-[#475569]">{feature}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className="w-full h-12 rounded-[10px] bg-[#0F172A] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#1E293B] transition-colors"
                >
                  {t("getStarted")}
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="creators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto"
            >
              {/* Header for creator plans */}
              <div className="text-center mb-10">
                <span className="inline-block bg-[#ECFDF5] text-[#059669] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                  {t("freeToJoin")}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">
                  {t("zeroToStart")}
                </h3>
                <p className="text-[#64748B] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  {t("creatorSubtitle")}
                </p>
              </div>

              {/* Two-column layout: Classic vs Founding Creators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Classic Plan */}
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 md:p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                      {t("classicTitle")}
                    </span>
                    <span className="text-xs font-semibold text-[#059669]">
                      {t("freeToJoin")}
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-bold text-[#0F172A]">
                        €0.90
                      </span>
                      <span className="text-sm text-[#64748B]">
                        / {t("perQualifiedClick")}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {[t("accessToBrands"), t("accessToAcademy")].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check
                          className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0"
                          strokeWidth={2.5}
                        />
                        <p className="text-sm text-[#475569]">{item}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-3">
                    <Link
                      href="/register"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
                    >
                      {t("createProfile")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {/* Spacer to preserve vertical alignment without showing a link */}
                    <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-0 select-none">
                      {t("foundingPdfCta")}
                    </span>
                  </div>
                </div>

                {/* Founding Creators Plan */}
                <div className="relative bg-white border-2 border-[#0F172A] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
                  {/* Most popular badge */}
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                      <Sparkles className="w-3 h-3" />
                      {t("mostPopular")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F172A]">
                      {t("foundingTitle")}
                    </span>
                    <span className="text-xs font-semibold text-[#059669]">
                      {t("freeToJoin")}
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-bold text-[#0F172A]">
                        €1.10
                      </span>
                      <span className="text-sm font-medium text-[#0F172A]">
                        / {t("perQualifiedClick")}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {[
                      t("foundingIncludesClassic"),
                      t("foundingWhatsapp"),
                      t("foundingBeta"),
                      t("foundingExclusive"),
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check
                          className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0"
                          strokeWidth={2.5}
                        />
                        <p className="text-sm text-[#0F172A]">{item}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-3">
                    <Link
                      href="/register"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#020617] transition-colors"
                    >
                      {t("createProfile")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/founding-creators-program.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] underline decoration-[#BFDBFE] decoration-1 underline-offset-4"
                    >
                      {t("foundingPdfCta")}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
