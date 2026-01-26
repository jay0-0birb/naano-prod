"use client";

import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { CaseStudySection } from "@/components/marketing/case-study-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { CreatorShowcaseSection } from "@/components/marketing/creator-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FooterSection } from "@/components/marketing/footer-section";

export default function LandingPage() {
  return (
    <main
      className="relative font-[var(--font-jakarta)] min-h-screen bg-white"
      style={{
        fontFamily:
          'var(--font-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Navbar />
      <HeroSection />
      <DemoSection />
      <HowItWorksSection />
      <CaseStudySection />
      <CreatorShowcaseSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </main>
  );
}
