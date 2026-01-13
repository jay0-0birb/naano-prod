'use client'

import { motion, useInView } from 'framer-motion'
import { ArrowRight, Heart, MessageCircle, Repeat2, CheckCircle, Linkedin, Users } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'

// Step 1: Match Card
const MatchCard = () => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 max-w-[260px] mx-auto relative shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
    {/* Verified Badge */}
    <div className="absolute top-4 right-4">
      <CheckCircle className="w-5 h-5 text-[#3B82F6]" />
    </div>

    {/* Profile Header */}
    <div className="flex items-center mb-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
          <Image
            src="https://i.pravatar.cc/150?img=17"
            alt="Alex Rivera"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-[18px] h-[18px] bg-[#0A66C2] rounded-full flex items-center justify-center border-2 border-white">
          <Linkedin className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="ml-3 flex-1">
        <p className="font-semibold text-[15px] text-[#0F172A] leading-[1.3]">Alex Rivera</p>
        <p className="text-xs text-[#64748B]">Tech Creator</p>
      </div>
    </div>

    {/* Stats */}
    <div className="flex gap-4 mb-4 pb-4 border-b border-[#F1F5F9]">
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <p className="text-xs text-[#0F172A] font-semibold">12.4k</p>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
        <p className="text-xs text-[#64748B]">8.2% eng.</p>
      </div>
    </div>

    {/* Tags */}
    <div className="flex gap-2 mb-4 flex-wrap">
      <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-medium px-2.5 py-1 rounded-full">
        React
      </span>
      <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-medium px-2.5 py-1 rounded-full">
        SaaS
      </span>
      <span className="bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-medium px-2.5 py-1 rounded-full">
        B2B
      </span>
    </div>

    {/* CTA Button */}
    <button className="w-full bg-[#0F172A] text-white text-[13px] font-medium h-[38px] rounded-lg hover:bg-[#1E293B] transition-colors">
      View Profile
    </button>
  </div>
)

// Step 2: Social Posts
const SocialPostsMockup = () => {
  const [counts, setCounts] = useState([
    { likes: 0, comments: 0, shares: 0 },
    { likes: 0, comments: 0 }
  ])
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const targets = [
            { likes: 124, comments: 18, shares: 32 },
            { likes: 89, comments: 12 }
          ]
          
          const duration = 2000
          const steps = 60
          
          targets.forEach((target, index) => {
            const incrementLikes = target.likes / steps
            const incrementComments = target.comments / steps
            const incrementShares = target.shares ? target.shares / steps : 0
            
            let currentLikes = 0
            let currentComments = 0
            let currentShares = 0
            
            const timer = setInterval(() => {
              currentLikes += incrementLikes
              currentComments += incrementComments
              if (incrementShares) currentShares += incrementShares
              
              if (currentLikes >= target.likes) {
                setCounts(prev => {
                  const newCounts = [...prev]
                  newCounts[index] = {
                    likes: target.likes,
                    comments: target.comments,
                    shares: target.shares || 0
                  }
                  return newCounts
                })
                clearInterval(timer)
              } else {
                setCounts(prev => {
                  const newCounts = [...prev]
                  newCounts[index] = {
                    likes: Math.round(currentLikes),
                    comments: Math.round(currentComments),
                    shares: Math.round(currentShares)
                  }
                  return newCounts
                })
              }
            }, duration / steps)
          })
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [hasAnimated])

  const posts = [
    { avatar: 32, handle: '@techcreator', text: 'Just tried @YourSaaS - game changer! 🚀' },
    { avatar: 45, handle: '@devinfluencer', text: 'My workflow is 10x faster with this tool 💜' },
  ]

  return (
    <div className="flex flex-col gap-3 max-w-[280px] mx-auto" ref={ref}>
      {posts.map((post, i) => (
        <div 
          key={i} 
          className="bg-white rounded-xl border border-gray-100 p-3 w-full shadow-[0_16px_48px_-12px_rgba(59,130,246,0.12),0_0_0_1px_rgba(59,130,246,0.04)]"
        >
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 overflow-hidden">
              <Image
                src={`https://i.pravatar.cc/150?img=${post.avatar}`}
                alt={post.handle}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-semibold text-xs text-[#111827]">{post.handle}</p>
          </div>
          <p className="text-xs text-[#111827] mb-2">{post.text}</p>
          <div className="flex gap-4 text-xs text-[#6B7280]">
            <div className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {counts[i]?.likes || 0}
            </div>
            <div className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              {counts[i]?.comments || 0}
            </div>
            {counts[i]?.shares > 0 && (
              <div className="flex items-center">
                <Repeat2 className="w-3 h-3 mr-1" />
                {counts[i].shares}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Step 3: Revenue Display
const RevenueDisplay = () => {
  const [revenue, setRevenue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const duration = 2000
          const target = 12.4
          const steps = 60
          const increment = target / steps
          let current = 0
          
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setRevenue(target)
              clearInterval(timer)
            } else {
              setRevenue(current)
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [hasAnimated])

  return (
    <div 
      ref={ref}
      className="bg-white rounded-xl border border-gray-100 p-5 max-w-[240px] mx-auto text-center shadow-[0_16px_48px_-12px_rgba(59,130,246,0.12),0_0_0_1px_rgba(59,130,246,0.04)]"
    >
      <p className="text-xs text-[#6B7280] mb-2">Campaign Results</p>
      <p className="text-3xl font-bold text-[#3B82F6] mb-1">
        ${revenue.toFixed(1)}k
      </p>
      <span className="bg-blue-50 text-[#3B82F6] text-xs px-2 py-0.5 rounded-full">+24% Growth</span>
    </div>
  )
}

export const HowItWorksSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const steps = [
    { title: 'Match with Creators', description: 'Find verified creators who understand your tech stack.', component: <MatchCard /> },
    { title: 'Creators Talk About You', description: 'Authentic content shared across social platforms.', component: <SocialPostsMockup /> },
    { title: 'Track & Scale', description: 'Monitor performance and grow what works.', component: <RevenueDisplay /> },
  ]

  return (
    <section className="py-16 md:py-24 bg-white relative" ref={ref}>
      {/* Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">
            How It Works
          </h2>
          <p className="text-base text-[#6B7280] max-w-lg mx-auto">
            Three simple steps from match to measurable growth.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 relative">
              <div className="flex flex-col gap-4 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {step.component}
                </motion.div>

                <div className="flex flex-col gap-2 text-center px-2">
                  <h3 className="text-base font-semibold text-[#111827]">{step.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight
                  className="absolute top-20 right-[-30px] text-gray-300 w-5 h-5 hidden md:block"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
