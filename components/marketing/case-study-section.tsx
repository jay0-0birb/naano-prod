"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, BarChart3, Target } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Viral-Ready Hooks",
    description:
      "Our creators know how to stop the scroll with proven frameworks.",
  },
  {
    icon: BarChart3,
    title: "Authentic Storytelling",
    description: "Real experiences, real results. No generic ad copy.",
  },
  {
    icon: Target,
    title: "Massive Reach",
    description: "100K+ impressions from accounts with just 2K followers.",
  },
];

export const CaseStudySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      className="py-16 md:py-24 bg-white relative overflow-hidden"
      ref={ref}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-16">
          {/* LEFT SIDE - Content & Methodology */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-[500px]"
          >
            {/* Badge */}
            <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit">
              FEATURES
            </span>
            {/* Heading */}
            <h2
              className="text-[32px] md:text-[44px] font-bold text-[#0F172A] tracking-[-0.03em] leading-[1.1] mb-5"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              The naano Framework:
              <br />
              <span className="text-[#3B82F6]">
                Consistency meets Virality.
              </span>
            </h2>

            {/* Subheadline */}
            <p
              className="text-lg text-[#64748B] leading-relaxed font-normal mb-10"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              We don't just match you with creators.{" "}
              <span className="font-semibold text-[#64748B]">
                We train them to write posts that convert specifically for
                brands.
              </span>
            </p>

            {/* Feature List */}
            <div className="flex flex-col gap-5">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-[#3B82F6]" />
                  </div>

                  {/* Text */}
                  <div className="pt-1">
                    <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT SIDE - Placeholder for phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 flex justify-center pb-12 lg:pb-0"
          >
            <div className="w-[280px] md:w-[320px] h-[560px] md:h-[620px] relative">
              {/* Simple phone bezel */}
              <div className="absolute inset-0 bg-[#111827] rounded-[32px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.3)] overflow-hidden p-1.5">
                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[26px] overflow-hidden relative flex items-center justify-center">
                  <p className="text-gray-400 text-sm">LinkedIn Post Preview</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
