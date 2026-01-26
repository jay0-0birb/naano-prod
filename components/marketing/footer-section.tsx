"use client";

import Link from "next/link";
import { ArrowRight, Linkedin } from "lucide-react";

// Social Media Links
const socialLinks = {
  linkedin: "https://www.linkedin.com/company/naanooo/",
};

export const FooterSection = () => {
  return (
    <footer>
      {/* Final CTA - Ultra Minimal Newsletter */}
      <div className="bg-white py-16 md:py-24 relative overflow-hidden border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-[600px] mx-auto text-center">
            <h2 className="text-[32px] md:text-[48px] font-extrabold text-[#111827] tracking-[-0.03em] leading-[1.1] mb-8">
              Ready to scale with <span className="text-[#3B82F6]">naano</span>?
            </h2>

            {/* Newsletter Input Group */}
            <form className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-[52px] bg-gray-50 border border-gray-200 rounded-full text-base px-6 focus:border-[#3B82F6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/10 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300"
              />
              <Link
                href="/register"
                className="h-[52px] px-8 bg-[#111827] text-white rounded-full text-[15px] font-semibold flex-shrink-0 hover:bg-[#1F2937] hover:-translate-y-[1px] hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                Get Started
              </Link>
            </form>

            <p className="text-[13px] text-gray-400 mt-4 text-center">No spam, ever.</p>
          </div>
        </div>
      </div>

      {/* Footer - Organized Grid with Large Branding */}
      <div className="bg-[#0F172A] pt-20 pb-8 relative overflow-hidden">
        {/* Massive NAANO Branding */}
        <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none z-0">
          <span className="text-[20vw] md:text-[16vw] lg:text-[14vw] font-black text-white/[0.03] leading-none tracking-[-0.05em]">
            NAANO
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            {/* Column 1: Brand */}
            <div className="flex flex-col gap-5">
              <p className="text-2xl font-bold text-white tracking-[-0.03em]">
                Naano
              </p>
              <p className="text-sm text-white/60 leading-relaxed max-w-[280px]">
                The first B2B marketplace connecting SaaS brands with vetted
                nano-influencers.
              </p>
              <div className="flex gap-3 pt-2">
                <Link
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:no-underline"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#3B82F6]/20 hover:border-[#3B82F6] border border-white/10 transition-all duration-200">
                    <Linkedin className="w-4 h-4 text-white/70" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="flex flex-col gap-3 ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                Product
              </p>
              <Link
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("how-it-works");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("pricing");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("faq");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                FAQs
              </Link>
            </div>

            {/* Column 3: Resources */}
            <div className="flex flex-col gap-3 ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                Resources
              </p>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Documentation
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Help Center
              </Link>
            </div>

            {/* Column 4: Company */}
            <div className="flex flex-col gap-3 ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                Company
              </p>
              <Link
                href="/about"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                About
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                Terms
              </Link>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10">
            <p className="text-[13px] text-white/40">
              © 2026 naano. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
