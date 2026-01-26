"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const brandsFaqs = [
  {
    question: "How do I track results?",
    answer:
      "Every creator is manually verified. We review their GitHub contributions, LinkedIn profile, audience engagement metrics, and content quality. Only the top 1% make it through.",
  },
  {
    question: "Who owns the content rights?",
    answer:
      "Brands get full commercial rights to use the content for ads, landing pages, and organic social media. Creators retain portfolio rights.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Brands pay based on performance, not vanity metrics. Pricing depends on the campaign scope and outcomes, so you only pay for real value delivered.",
  },
];

const creatorsFaqs = [
  {
    question: "Is it really free for creators?",
    answer:
      "Yes, absolutely. We charge a service fee to the brands, not the talent. You keep 100% of your negotiated rate.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up as a creator, complete your profile, and start applying to campaigns that match your expertise. Once approved, you'll receive tracked links and can start creating content.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Payment is released instantly once the brand validates your deliverable. Funds are secured upfront when a campaign is approved, so you're guaranteed payment for completed work.",
  },
];

export const FAQSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentFaqs = activeTab === "brands" ? brandsFaqs : creatorsFaqs;

  return (
    <section id="faq" className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* FAQ Header */}
        <div className="flex flex-col text-center mb-10">
          <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
            FAQs
          </span>
          <h3
            className="text-[32px] md:text-[44px] font-bold text-[#111827] tracking-[-0.03em] leading-[1.1]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Frequently Asked Questions
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
                  {tab === "brands" ? "For Brands" : "For Creators"}
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
