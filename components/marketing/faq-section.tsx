"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export const FAQSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations("faq");
  const tBrands = useTranslations("faq.brands");
  const tCreators = useTranslations("faq.creators");

  const brandsFaqs = [
    { question: tBrands("q1"), answer: tBrands("a1") },
    { question: tBrands("q2"), answer: tBrands("a2") },
    { question: tBrands("q3"), answer: tBrands("a3") },
    { question: tBrands("q4"), answer: tBrands("a4") },
    { question: tBrands("q5"), answer: tBrands("a5") },
    { question: tBrands("q6"), answer: tBrands("a6") },
  ];

  const creatorsFaqs = [
    { question: tCreators("q1"), answer: tCreators("a1") },
    { question: tCreators("q2"), answer: tCreators("a2") },
    { question: tCreators("q3"), answer: tCreators("a3") },
    { question: tCreators("q4"), answer: tCreators("a4") },
  ];

  const currentFaqs = activeTab === "brands" ? brandsFaqs : creatorsFaqs;

  return (
    <section id="faq" className="py-16 sm:py-20 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* FAQ Header */}
        <div className="flex flex-col text-center mb-8 sm:mb-10">
          <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
            {t("badge")}
          </span>
          <h3
            className="text-[28px] sm:text-[36px] md:text-[44px] font-bold text-[#111827] tracking-[-0.03em] leading-[1.1]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("title")}
          </h3>

          {/* Toggle */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-full mt-6 w-fit mx-auto">
            {["brands", "creators"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as "brands" | "creators");
                    setOpenIndex(null); // Close any open FAQ when switching tabs
                  }}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-[#0F172A] bg-white shadow-sm"
                      : "text-[#64748B] bg-transparent"
                  } hover:text-[#0F172A]`}
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {tab === "brands" ? t("forBrands") : t("forCreators")}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.08),0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            {currentFaqs.map((faq, index) => (
              <div
                key={index}
                className={`border-b ${index < currentFaqs.length - 1 ? "border-[#E5E7EB]" : "border-none"}`}
              >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-5 px-6 hover:bg-[#F8FAFC] flex items-center justify-between transition-colors"
              >
                <span
                  className="flex-1 text-left font-bold text-[15px] text-[#111827]"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#64748B] transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div
                  className="pb-5 px-6 text-[#4B5563] text-sm leading-relaxed"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {faq.answer}
                </div>
              )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
