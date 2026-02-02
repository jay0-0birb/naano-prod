'use client'

import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const DemoSection = () => {
  const t = useTranslations('demo')
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="max-w-[1000px] mx-auto"
        >
          {/* Browser Frame */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
            {/* Browser Header */}
            <div className="h-12 flex items-center px-4 border-b border-gray-100 bg-gray-50 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 mx-4 h-7 bg-white rounded-md border border-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-400">naano.com/demo</p>
              </div>
            </div>

            {/* Video Placeholder Area */}
            <div
              className="relative pt-[56.25%] bg-gray-900 cursor-pointer group"
              role="group"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Play Button */}
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-gray-900 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Play className="w-8 h-8 ml-1 fill-current" />
                </div>

                <p className="absolute bottom-8 text-white font-medium opacity-80">
                  {t('watchDemo')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


