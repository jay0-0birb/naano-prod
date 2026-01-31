"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { CaseStudySection } from "@/components/marketing/case-study-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { CreatorShowcaseSection } from "@/components/marketing/creator-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FooterSection } from "@/components/marketing/footer-section";
import { ChevronUp } from "lucide-react";

export default function LandingPage() {
  const [showContent, setShowContent] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main
      className="relative min-h-screen bg-white"
      style={{
        fontFamily: "Satoshi, sans-serif",
      }}
    >
      <Navbar showContent={showContent} />
      <HeroSection onContentShow={setShowContent} showContent={showContent} />
      <DemoSection />
      <HowItWorksSection />
      <CaseStudySection />
      <CreatorShowcaseSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[900] w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/90 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#4B5563]" />
        </button>
      )}
    </main>
  );
}
