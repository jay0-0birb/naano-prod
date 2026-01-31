"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

interface NavbarProps {
  showContent: boolean;
}

export const Navbar = ({ showContent }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", action: () => scrollToSection("how-it-works") },
    { label: "Pricing", action: () => scrollToSection("pricing") },
    { label: "FAQs", action: () => scrollToSection("faq") },
    { label: "About", href: "/about" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] px-4 sm:px-6 pt-3 sm:pt-4 md:pt-6 transition-opacity duration-300 ${
        showContent ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center justify-end mr-4 sm:mr-6 md:mr-10 relative">
        {/* Menu Items - Slide in from right */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mr-10 sm:mr-12 absolute right-0 bg-white sm:bg-transparent p-4 sm:p-0 rounded-lg sm:rounded-none shadow-lg sm:shadow-none border sm:border-0 border-gray-200 sm:border-0"
            >
              {navItems.map((item, index) => {
                const baseClasses =
                  "font-semibold text-base md:text-[17px] underline text-[#4B5563] hover:text-[#3B82F6] transition-colors";
                const style = { fontFamily: "Satoshi, sans-serif" };

                if (item.href) {
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={baseClasses}
                        style={style}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <button
                      onClick={() => {
                        item.action?.();
                        setIsMenuOpen(false);
                      }}
                      className={baseClasses}
                      style={style}
                    >
                      {item.label}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Toggle Button - Fixed position */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative z-10"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-[#4B5563]" />
          ) : (
            <Menu className="w-5 h-5 text-[#4B5563]" />
          )}
        </motion.button>
      </div>
    </nav>
  );
};
