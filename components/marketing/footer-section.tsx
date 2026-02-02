"use client";

import Link from "next/link";
import { ArrowRight, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

// Social Media Links
const socialLinks = {
  linkedin: "https://www.linkedin.com/company/naanooo/",
};

export const FooterSection = () => {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  return (
    <footer>
      {/* Final CTA - Ultra Minimal Newsletter */}
      <div className="bg-white py-12 sm:py-16 md:py-24 relative overflow-hidden border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-[600px] mx-auto text-center">
            <h2 className="text-[28px] sm:text-[36px] md:text-[48px] font-extrabold text-[#111827] tracking-[-0.03em] leading-[1.1] mb-6 sm:mb-8">
              {t("readyToScale")} <span className="text-[#3B82F6]">{t("naano")}</span>?
            </h2>

            {/* Newsletter Input Group */}
            <form className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto justify-center px-4">
              <input
                type="email"
                placeholder={tCommon("enterEmail")}
                className="h-[48px] sm:h-[52px] bg-gray-50 border border-gray-200 rounded-full text-sm sm:text-base px-5 sm:px-6 focus:border-[#3B82F6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/10 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300"
              />
              <Link
                href="/register"
                className="h-[48px] sm:h-[52px] px-6 sm:px-8 bg-[#0F172A] text-white rounded-full text-sm sm:text-[15px] font-semibold flex-shrink-0 hover:bg-[#1E293B] hover:-translate-y-[1px] hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                {tCommon("getStarted")}
              </Link>
            </form>

            <p className="text-[13px] text-gray-400 mt-4 text-center">{tCommon("noSpam")}</p>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-16">
            {/* Column 1: Brand */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-[-0.03em]">
                {t("naano")}
              </p>
              <p className="text-sm text-white/60 leading-relaxed max-w-[280px]">
                {t("tagline")}
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
            <div className="flex flex-col gap-3 ml-0 sm:ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                {tCommon("product")}
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
                {tCommon("features")}
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
                {tCommon("pricing")}
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
                {tCommon("faqs")}
              </Link>
            </div>

            {/* Column 3: Resources */}
            <div className="flex flex-col gap-3 ml-0 sm:ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                {tCommon("resources")}
              </p>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {tCommon("documentation")}
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {tCommon("helpCenter")}
              </Link>
            </div>

            {/* Column 4: Company */}
            <div className="flex flex-col gap-3 ml-0 sm:ml-8 md:ml-12">
              <p className="text-[11px] font-semibold text-white/90 tracking-[0.08em] uppercase mb-2">
                {tCommon("company")}
              </p>
              <Link
                href="/about"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {tCommon("about")}
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {tCommon("privacy")}
              </Link>
              <Link
                href="#"
                className="text-sm text-white/50 hover:text-white transition-colors duration-150"
              >
                {tCommon("terms")}
              </Link>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10">
            <p className="text-[13px] text-white/40">
              {tCommon("allRightsReserved")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
