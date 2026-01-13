'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Users } from 'lucide-react'
import Image from 'next/image'

// Mock Data for Creator Cards
const creators = [
  {
    name: 'David Park',
    handle: '@design_david',
    role: 'Product Design',
    avatar: 'https://i.pravatar.cc/150?u=david',
    tags: ['Design', 'UX/UI', 'Tools'],
    audience: '30k+',
  },
  {
    name: 'Lisa Thompson',
    handle: '@lisa_fintech',
    role: 'Fintech Expert',
    avatar: 'https://i.pravatar.cc/150?u=lisa',
    tags: ['Fintech', 'Finance', 'B2B'],
    audience: '28k+',
  },
  {
    name: 'James Miller',
    handle: '@james_nocode',
    role: 'No-Code Pro',
    avatar: 'https://i.pravatar.cc/150?u=james',
    tags: ['NoCode', 'Automation', 'SaaS'],
    audience: '20k+',
  },
  {
    name: 'Sarah Chen',
    handle: '@sarah.tech',
    role: 'SaaS Growth',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    tags: ['B2B', 'Tech', 'AI'],
    audience: '20k+',
  },
  {
    name: 'Emma Wilson',
    handle: '@emma_marketing',
    role: 'Marketing Tips',
    avatar: 'https://i.pravatar.cc/150?u=emma',
    tags: ['Marketing', 'Growth', 'B2B'],
    audience: '45k+',
  },
  {
    name: 'Alex Rivera',
    handle: '@alex_builds',
    role: 'Indie Hacker',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    tags: ['DevTools', 'SaaS', 'Coding'],
    audience: '30k+',
  },
]

const CreatorCard = ({ creator }: { creator: typeof creators[0] }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 w-[300px] flex-shrink-0 relative transition-all duration-200 hover:border-blue-400 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.15)]">
    {/* Verified Badge */}
    <div className="absolute top-5 right-5">
      <CheckCircle2 className="w-5 h-5 text-[#3B82F6] fill-[#EFF6FF]" />
    </div>

    {/* Header */}
    <div className="flex gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
        <Image
          src={creator.avatar}
          alt={creator.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-900 leading-tight">
          {creator.name}
        </p>
        <p className="text-xs text-gray-500 font-medium">{creator.handle}</p>
      </div>
    </div>

    {/* Tags */}
    <div className="flex gap-2 mb-4 flex-wrap">
      {creator.tags.map((tag) => (
        <span
          key={tag}
          className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-md border border-gray-100"
        >
          {tag}
        </span>
      ))}
    </div>

    {/* Platforms Grid */}
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[11px] text-gray-500 font-medium">Audience</p>
        </div>
        <p className="text-[13px] font-semibold text-gray-900">{creator.audience}</p>
      </div>
    </div>
  </div>
)

export const CreatorShowcaseSection = () => {
  return (
    <section id="creators" className="py-20 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
        <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100">
          DISCOVER CREATORS
        </span>
        <h2 className="text-[32px] md:text-[44px] font-bold text-gray-900 tracking-[-0.03em] leading-[1.1] mb-4">
          Find your perfect match
        </h2>
        <p className="text-lg text-gray-500 max-w-[600px] mx-auto">
          Browse through hundreds of vetted B2B creators ready to showcase your product.
        </p>
      </div>

      {/* Marquee Container - Row 1 */}
      <div className="relative w-full mb-8">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-[150px] bg-gradient-to-r from-white to-transparent z-[2] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gradient-to-l from-white to-transparent z-[2] pointer-events-none" />

        <motion.div
          animate={{ x: [0, -1800] }}
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: 'linear',
          }}
          className="flex gap-6 pl-6 w-max"
        >
          {[...creators, ...creators, ...creators].map((creator, i) => (
            <CreatorCard key={i} creator={creator} />
          ))}
        </motion.div>
      </div>

      {/* Marquee Container - Row 2 (Reverse) */}
      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-[150px] bg-gradient-to-r from-white to-transparent z-[2] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gradient-to-l from-white to-transparent z-[2] pointer-events-none" />

        <motion.div
          animate={{ x: [-1800, 0] }}
          transition={{
            repeat: Infinity,
            duration: 45,
            ease: 'linear',
          }}
          className="flex gap-6 pl-6 w-max"
        >
          {[...[...creators].reverse(), ...[...creators].reverse(), ...[...creators].reverse()].map(
            (creator, i) => (
              <CreatorCard key={i} creator={creator} />
            )
          )}
        </motion.div>
      </div>
    </section>
  )
}

