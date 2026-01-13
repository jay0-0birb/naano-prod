import { Navbar } from './components/navbar'
import { HeroSection } from './components/hero-section'
import { DemoSection } from './components/demo-section'
import { CaseStudySection } from './components/case-study-section'
import { HowItWorksSection } from './components/how-it-works-section'
import { CreatorShowcaseSection } from './components/creator-showcase-section'
import { PricingSection } from './components/pricing-section'
import { FAQSection } from './components/faq-section'
import { FooterSection } from './components/footer-section'

export default function Home() {
  return (
    <main>
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
  )
}

