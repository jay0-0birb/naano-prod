"use client";

import { useState } from "react";
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
  const [showContent, setShowContent] = useState(false);

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
    </main>
  );
}
