"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { CaseStudySection } from "@/components/marketing/case-study-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { CreatorShowcaseSection } from "@/components/marketing/creator-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FooterSection } from "@/components/marketing/footer-section";
import { AnimationIntro } from "@/components/marketing/animation-intro";
import LiquidEther from "@/components/LiquidEther";

export default function LandingPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    // TEMPORARILY DISABLED - Always show intro for testing
    // const visited = sessionStorage.getItem('konex-intro-seen');
    // if (visited) {
    //   setShowIntro(false);
    //   setShowContent(true);
    // }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("konex-intro-seen", "true");

    // Start the transition
    setIsTransitioning(true);

    // After color transition completes, hide intro and show content
    setTimeout(() => {
      setShowIntro(false);
      setShowContent(true);
    }, 1500); // Match the transition duration
  };

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show animation intro
  if (showIntro) {
    return (
      <AnimationIntro
        onComplete={handleIntroComplete}
        isTransitioning={isTransitioning}
      />
    );
  }

  return (
    <main
      className="relative font-[var(--font-jakarta)] min-h-screen bg-white"
      style={{
        fontFamily:
          'var(--font-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Liquid Ether Background */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <LiquidEther
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          colors={["#00fdff","#0433ff","#00fdff"]}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          isBounce={false}
          resolution={0.5}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Navbar - always visible, no animation */}
      <Navbar />

      <div
        className={`transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
      >
        <div className="animate-section" style={{ animationDelay: "0ms" }}>
          <HeroSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "200ms" }}>
          <DemoSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "400ms" }}>
          <HowItWorksSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "600ms" }}>
          <CaseStudySection />
        </div>
        <div className="animate-section" style={{ animationDelay: "800ms" }}>
          <CreatorShowcaseSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "1000ms" }}>
          <PricingSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "1200ms" }}>
          <FAQSection />
        </div>
        <div className="animate-section" style={{ animationDelay: "1400ms" }}>
          <FooterSection />
        </div>
      </div>
    </main>
  );
}
