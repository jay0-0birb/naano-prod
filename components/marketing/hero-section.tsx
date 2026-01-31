"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ParticleFace } from "./particle-face";

interface HeroSectionProps {
  onContentShow: (show: boolean) => void;
  showContent: boolean;
}

export const HeroSection = ({
  onContentShow,
  showContent,
}: HeroSectionProps) => {
  const words = ["Scale", "Boost", "Grow"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFaceComplete = () => {
    onContentShow(true);
  };

  return (
    <section className="min-h-screen relative overflow-hidden bg-white">
      {/* Particle Face Animation - Right Side */}
      <ParticleFace onComplete={handleFaceComplete} />

      {/* Content - Left Side */}
      <div
        className={`max-w-7xl mx-auto relative z-[2] pt-32 sm:pt-36 md:pt-44 lg:pt-52 pb-12 sm:pb-16 md:pb-20 lg:pb-24 px-4 sm:px-6 ${showContent ? "opacity-100" : "opacity-0"}`}
      >
        {/* Text Content - Aligned along pink line */}
        <div className="text-left max-w-full sm:max-w-[600px] ml-0 md:ml-8 lg:ml-16 mb-12 sm:mb-16 md:mb-20 lg:mb-28">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={
              showContent ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1
              className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[56px] xl:text-[64px] font-bold leading-[1.1] tracking-[-0.03em] text-[#111827] mb-4 sm:mb-6"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[currentWordIndex]}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>{" "}
              your SaaS
              <br />
              <span>
                with{" "}
                <span className="text-[#3B82F6] relative">
                  nano-creators
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[#3B82F6] opacity-30 rounded-full" />
                </span>
                .
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={
              showContent ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
            }
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-10"
          >
            <p
              className="text-base sm:text-lg font-normal text-[#4B5563] leading-relaxed max-w-[600px]"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              Access a curated network of vetted nano-influencers (1-50k). The
              first performance-based B2B marketplace.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={
              showContent ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
            }
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Get started button - Position A (dark) */}
              <Link
                href="/register"
                className="h-12 sm:h-14 px-8 sm:px-10 bg-[#0F172A] text-white rounded-full font-bold text-sm sm:text-[15px] hover:bg-[#1E293B] hover:-translate-y-[2px] hover:shadow-[0_8px_30px_0_rgba(17,24,39,0.25)] transition-all duration-200 flex items-center justify-center"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                Get started
              </Link>
              {/* Sign in button - Position B (white) */}
              <Link
                href="/login"
                className="h-12 sm:h-14 px-8 sm:px-10 bg-white text-[#111827] rounded-full border border-[#E5E7EB] font-bold text-sm sm:text-[15px] hover:border-[#111827] hover:bg-[#F9FAFB] transition-all duration-200 flex items-center justify-center"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Logos Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={showContent ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-8 sm:mt-10 md:mt-14 lg:mt-20"
        >
          <p
            className="text-xs font-bold tracking-[0.1em] text-[#9CA3AF] uppercase text-center mb-6 sm:mb-8 md:mb-10"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Trusted by growth teams at
          </p>

          <div className="flex justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 xl:gap-20 flex-wrap max-w-[1000px] mx-auto px-4">
            {["Vercel", "Linear", "Notion", "Stripe", "Loom", "Figma"].map(
              (brand) => (
                <p
                  key={brand}
                  className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#CBD5E1] hover:text-[#64748B] transition-colors duration-300 cursor-default"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {brand}
                </p>
              ),
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
