'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  { question: 'How do you vet the creators?', answer: 'Every creator is manually verified. We review their GitHub contributions, LinkedIn profile, audience engagement metrics, and content quality. Only the top 1% make it through.' },
  { question: 'Is it really free for creators?', answer: 'Yes, absolutely. We charge a service fee to the brands, not the talent. You keep 100% of your negotiated rate.' },
  { question: 'Who owns the content rights?', answer: 'Brands get full commercial rights to use the content for ads, landing pages, and organic social media. Creators retain portfolio rights.' },
  { question: 'How does escrow work?', answer: 'Funds are secured upfront when a brand approves a campaign. They are released to the creator instantly once the brand validates the final deliverable.' },
]

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* FAQ Header */}
        <div className="flex flex-col gap-3 text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-[#111827]">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.08),0_1px_2px_0_rgba(15,23,42,0.04)]">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border-b ${index < faqs.length - 1 ? 'border-[#E5E7EB]' : 'border-none'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-5 px-6 hover:bg-[#F8FAFC] flex items-center justify-between transition-colors"
              >
                <span className="flex-1 text-left font-semibold text-[15px] text-[#111827]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#64748B] transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="pb-5 px-6 text-[#4B5563] text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

