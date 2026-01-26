"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const saasPricing = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for testing creator marketing.",
    features: ["3 creators max", "Basic analytics", "Tracked links"],
    highlight: false,
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    price: 59,
    description: "Scale your SaaS with consistent content.",
    features: [
      "Everything in Starter",
      "10 creators max",
      "Advanced analytics",
    ],
    highlight: true,
    cta: "Get Started",
  },
  {
    name: "Scale",
    price: 89,
    description: "For teams managing multiple brands.",
    features: [
      "Everything in Growth",
      "Unlimited creators",
      "Mutli-brand dashboard",
    ],
    highlight: false,
    cta: "Contact Sales",
  },
];

export const PricingSection = () => {
  const [activeTab, setActiveTab] = useState<"saas" | "creators">("saas");

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

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col text-center mb-12">
          <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
            PRICING
          </span>
          <h2
            className="text-[32px] md:text-[44px] font-bold text-[#0F172A] tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="text-lg text-[#64748B] max-w-[600px] mx-auto"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            No hidden fees. Start, then upgrade as you grow.
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
                  {tab === "saas" ? "For Brands" : "For Creators"}
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
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
                {saasPricing.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative bg-white rounded-2xl p-6 flex flex-col ${
                      plan.highlight
                        ? "border-2 border-[#0F172A]"
                        : "border border-[#E5E7EB]"
                    } hover:border-[#CBD5E1] transition-all duration-200`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.05em]">
                        Popular
                      </span>
                    )}

                    {/* Plan Name */}
                    <p className="text-sm font-semibold text-[#64748B] mb-1">
                      {plan.name}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold text-[#0F172A] tracking-[-0.03em]">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-[#94A3B8] ml-1">
                        /month
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* CTA */}
                    <Link
                      href="/register"
                      className={`w-full h-11 rounded-[10px] text-sm font-semibold mb-6 flex items-center justify-center transition-all duration-200 ${
                        plan.highlight
                          ? "bg-[#0F172A] text-white border border-[#0F172A] hover:bg-[#1E293B]"
                          : "bg-white text-[#0F172A] border border-[#E5E7EB] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    {/* Features */}
                    <div className="flex flex-col gap-3 pt-6 border-t border-[#F1F5F9]">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check
                            className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0"
                            strokeWidth={2.5}
                          />
                          <p className="text-[13px] text-[#475569]">
                            {feature}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="creators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-[600px] mx-auto"
            >
              <div className="bg-[#F8FAFC] rounded-[20px] p-8 md:p-12 text-center border border-[#E5E7EB]">
                {/* Free Badge */}
                <span className="inline-block bg-[#ECFDF5] text-[#059669] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                  Free to join
                </span>

                <h3 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-4">
                  $0 to get started
                </h3>

                <p className="text-[#64748B] text-lg mb-8 leading-relaxed">
                  We take a small commission on your earnings — only when you
                  get paid.
                </p>

                {/* Simple benefits */}
                <div className="flex flex-col gap-3 mb-8">
                  {["No upfront costs", "Access to premium SaaS brands"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center justify-center gap-2"
                      >
                        <Check
                          className="w-[18px] h-[18px] text-[#10B981]"
                          strokeWidth={2.5}
                        />
                        <p className="text-[15px] text-[#475569]">{item}</p>
                      </div>
                    ),
                  )}
                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-[#0F172A] text-[15px] font-semibold hover:text-[#3B82F6] transition-colors duration-200"
                >
                  Create your profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
