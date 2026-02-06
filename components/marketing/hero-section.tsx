"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ParticleFace } from "./particle-face";

interface HeroSectionProps {
  onContentShow: (show: boolean) => void;
  showContent: boolean;
}

export const HeroSection = ({
  onContentShow,
  showContent,
}: HeroSectionProps) => {
  const t = useTranslations("hero");
  const words = [t("scale"), t("boost"), t("grow")];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);

  const brandHoverFilters: Record<string, string> = {
    Loops: "brightness(0) saturate(100%) invert(71%) sepia(52%) saturate(10000%) hue-rotate(185deg) brightness(1.1) contrast(101%)",
    Pletor: "brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(2000%) hue-rotate(360deg) brightness(1.05) contrast(101%)",
    Zmirov: "brightness(0) saturate(100%) invert(0%)",
    "We are founders": "brightness(0) saturate(100%) invert(25%) sepia(95%) saturate(5000%) hue-rotate(355deg) brightness(0.95) contrast(105%)",
  };
  const defaultFilter = "brightness(0) invert(0.84)";

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
        <div className="text-left max-w-full sm:max-w-[600px] ml-0 md:ml-8 lg:ml-16 mb-[2.875rem] sm:mb-12 md:mb-16 lg:mb-24">
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
              </AnimatePresence>
              {t("line1Suffix") && <> {t("line1Suffix")}</>}
              <br />
              <span>
                {t("line2Prefix")}
                <span className="text-[#3B82F6] relative">
                  {t("nanoCreators")}
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
              {t("subtitle")}
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
                {t("getStarted")}
              </Link>
              {/* Sign in button - Position B (white) */}
              <Link
                href="/login"
                className="h-12 sm:h-14 px-8 sm:px-10 bg-white text-[#111827] rounded-full border border-[#E5E7EB] font-bold text-sm sm:text-[15px] hover:border-[#111827] hover:bg-[#F9FAFB] transition-all duration-200 flex items-center justify-center"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {t("signIn")}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Logos Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={showContent ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-[1.875rem] sm:mt-8 md:mt-10 lg:mt-16"
        >
          <p
            className="text-xs font-bold tracking-[0.1em] text-[#9CA3AF] uppercase text-center mb-6 sm:mb-8 md:mb-10"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("trustedBy")}
          </p>

          <div className="flex justify-between items-center w-full max-w-6xl mx-auto px-6 sm:px-8">
            {[
              {
                name: "Loops",
                logo: "/logos/loops.svg",
                url: "https://tryloops.ai/",
              },
              {
                name: "Pletor",
                logo: "/logos/pletor.svg",
                url: "https://www.pletor.ai/",
              },
              {
                name: "Zmirov",
                logo: "/logos/zmirov.svg",
                url: "https://zmirov.com/",
              },
              {
                name: "We are founders",
                logo: "/logos/wearefounders.svg",
                url: "https://wearefounders.com/",
              },
            ].map((brand) => (
              <motion.a
                key={brand.name}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex-1 flex items-center justify-center min-w-0 rounded-lg py-2 ${brand.name === "Loops" ? "pl-2 pr-10 sm:pl-4 sm:pr-12 md:pl-4 md:pr-16" : "px-2 sm:px-4"}`}
                initial={false}
                whileHover={{
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                aria-label={brand.name}
                onMouseEnter={() => setHoveredBrand(brand.name)}
                onMouseLeave={() => setHoveredBrand(null)}
              >
                <img
                  src={brand.logo}
                  alt=""
                  className="w-auto object-contain h-10 sm:h-12 md:h-14 lg:h-16 transition-[filter] duration-200"
                  style={{
                    filter:
                      hoveredBrand === brand.name
                        ? brandHoverFilters[brand.name]
                        : defaultFilter,
                    transform:
                      brand.name === "Loops" ? "scale(3.7)" : undefined,
                    transformOrigin: "center",
                  }}
                />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
