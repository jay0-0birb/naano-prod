'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export const HeroSection = () => {
  const words = ['Scale', 'Boost', 'Grow']
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto relative z-[2] pt-28 md:pt-36 pb-16 md:pb-24 px-4">
        {/* Text Content */}
        <div className="text-center max-w-[800px] mx-auto mb-20 md:mb-28">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-[40px] md:text-[56px] lg:text-[68px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#111827] mb-6">
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
              {' '}your SaaS
              <br />
              <span>
                with{' '}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10"
          >
            <p className="text-[17px] md:text-[19px] font-normal text-[#4B5563] leading-[1.7] max-w-[560px] mx-auto">
              Access a curated network of vetted nano-influencers (1-50k).
              The first performance-based B2B marketplace.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="h-14 px-10 bg-[#111827] text-white rounded-full font-medium text-[15px] hover:bg-[#1F2937] hover:-translate-y-[2px] hover:shadow-[0_8px_30px_0_rgba(17,24,39,0.25)] transition-all duration-200 flex items-center justify-center"
              >
                Scale my Revenue
              </Link>
              <Link
                href="/register"
                className="h-14 px-10 bg-white text-[#111827] rounded-full border border-[#E5E7EB] font-medium text-[15px] hover:border-[#111827] hover:bg-[#F9FAFB] transition-all duration-200 flex items-center justify-center"
              >
                Monetize my Audience
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Logos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-xs font-medium tracking-[0.1em] text-[#9CA3AF] uppercase text-center mb-10">
            Trusted by growth teams at
          </p>

          <div className="flex justify-center items-center gap-10 md:gap-16 lg:gap-20 flex-wrap max-w-[1000px] mx-auto">
            {['Vercel', 'Linear', 'Notion', 'Stripe', 'Loom', 'Figma'].map((brand) => (
              <p
                key={brand}
                className="text-xl md:text-2xl font-semibold text-[#CBD5E1] hover:text-[#64748B] transition-colors duration-300 cursor-default"
              >
                {brand}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}


