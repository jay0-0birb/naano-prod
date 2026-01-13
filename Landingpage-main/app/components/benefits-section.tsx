'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Container, Heading, Text, Flex, Grid, VStack, Avatar, Badge, HStack, Icon } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, BarChart3, Zap, Video, Banknote, Lock, TrendingUp, CheckCircle, Users, ArrowUpRight } from 'lucide-react'

const MotionBox = motion(Box)

// SaaS 1: Talent - Minimal UI widget
const TalentVisual = () => {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const duration = 2000
          const target = 547
          const steps = 60
          const increment = target / steps
          let current = 0
          
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(current)
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
    <Box h="200px" px={6} pt={6} pb={4} ref={ref}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={5}>
        <Text fontSize="10px" fontWeight="500" color="#64748B" letterSpacing="0.05em" lineHeight="1">ACTIVE CREATORS</Text>
        <Icon as={ShieldCheck} w={3.5} h={3.5} color="#10B981" flexShrink={0} />
      </Flex>

      {/* Counter display */}
      <Box bg="#F8FAFC" border="1px solid #F1F5F9" rounded="6px" p={3} mb={5}>
        <Text fontSize="24px" fontWeight="600" color="#0F172A" letterSpacing="-0.02em" lineHeight="1" mb={2}>
          {Math.round(count)}
        </Text>
        <Text fontSize="9px" color="#64748B" lineHeight="1.2">verified this month</Text>
      </Box>

      {/* Platform breakdown - horizontal bars */}
      <VStack spacing={4} align="stretch">
        {[
          { platform: 'LinkedIn', count: 312, color: '#0A66C2', percent: 65 },
          { platform: 'Instagram', count: 235, color: '#E4405F', percent: 35 },
        ].map((item) => (
          <Box key={item.platform}>
            <Flex justify="space-between" align="center" mb={2}>
              <HStack spacing={2}>
                <Box w="6px" h="6px" bg={item.color} rounded="sm" flexShrink={0} />
                <Text fontSize="10px" color="#64748B" fontWeight="500" lineHeight="1">{item.platform}</Text>
              </HStack>
              <Text fontSize="10px" color="#0F172A" fontWeight="600" lineHeight="1">{item.count}</Text>
            </Flex>
            <Box bg="#F1F5F9" h="2px" rounded="full" overflow="hidden">
              <Box w={`${item.percent}%`} h="full" bg={item.color} opacity={0.7} rounded="full" />
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

// SaaS 2: Performance Chart - Clean
const PerformanceCurve = () => (
  <Box h="200px" position="relative" px={6} pt={6} pb={4}>
    <svg viewBox="0 0 300 120" width="100%" height="100%">
      <motion.path
        d="M0,80 L30,75 L60,70 L90,60 L120,55 L150,45 L180,35 L210,28 L240,20 L270,15 L300,10"
        fill="none"
        stroke="#0F172A"
        strokeWidth="1.5"
        opacity="0.7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.circle
        cx="270"
        cy="15"
        r="3"
        fill="#0F172A"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
    </svg>
    <Flex position="absolute" top="4" right="4" align="center" gap={1} bg="#ECFDF5" px={2} py={1} rounded="6px" border="1px solid #D1FAE5">
      <Icon as={TrendingUp} w={3} h={3} color="#10B981" />
      <Text fontSize="11px" fontWeight="600" color="#059669">+247%</Text>
    </Flex>
  </Box>
)

// SaaS 3: Nano vs Macro - Technical comparison table
const NanoInfluencersVisual = () => (
  <Box h="200px" px={6} pt={6} pb={4}>
    {/* Header */}
    <Flex justify="space-between" align="center" mb={5}>
      <Text fontSize="11px" fontWeight="500" color="#64748B" letterSpacing="0.03em">PERFORMANCE METRICS</Text>
      <Icon as={Zap} w={3.5} h={3.5} color="#3B82F6" opacity={0.5} />
    </Flex>

    {/* Comparison table */}
    <VStack spacing={0} align="stretch">
      {/* Header row */}
      <Grid templateColumns="90px 1fr 1fr" gap={3} pb={2.5} borderBottom="1px solid #F1F5F9">
        <Text fontSize="9px" color="#94A3B8" fontWeight="500" letterSpacing="0.05em" textTransform="uppercase">Metric</Text>
        <Text fontSize="9px" color="#94A3B8" fontWeight="500" letterSpacing="0.05em" textTransform="uppercase" textAlign="right">Macro</Text>
        <Text fontSize="9px" color="#3B82F6" fontWeight="500" letterSpacing="0.05em" textTransform="uppercase" textAlign="right">Nano</Text>
      </Grid>

      {/* Engagement row */}
      <Grid templateColumns="90px 1fr 1fr" gap={3} py={3} borderBottom="1px solid #F1F5F9" alignItems="center">
        <Text fontSize="11px" color="#64748B" fontWeight="500" lineHeight="1.4">Engagement</Text>
        <Text fontSize="16px" color="#CBD5E1" fontWeight="600" textAlign="right" letterSpacing="-0.02em" lineHeight="1">1.7%</Text>
        <HStack justify="flex-end" spacing={1.5}>
          <Text fontSize="16px" color="#0F172A" fontWeight="600" letterSpacing="-0.02em" lineHeight="1">8.2%</Text>
          <Box bg="#ECFDF5" px={1.5} py={0.5} rounded="3px">
            <Text fontSize="8px" color="#059669" fontWeight="600">+382%</Text>
          </Box>
        </HStack>
      </Grid>

      {/* Cost row */}
      <Grid templateColumns="90px 1fr 1fr" gap={3} py={3} borderBottom="1px solid #F1F5F9" alignItems="center">
        <Text fontSize="11px" color="#64748B" fontWeight="500" lineHeight="1.4">Cost/Conv</Text>
        <Text fontSize="16px" color="#CBD5E1" fontWeight="600" textAlign="right" letterSpacing="-0.02em" textDecoration="line-through" lineHeight="1">€145</Text>
        <HStack justify="flex-end" spacing={1.5}>
          <Text fontSize="16px" color="#10B981" fontWeight="600" letterSpacing="-0.02em" lineHeight="1">€32</Text>
          <Box bg="#ECFDF5" px={1.5} py={0.5} rounded="3px">
            <Text fontSize="8px" color="#059669" fontWeight="600">-77%</Text>
          </Box>
        </HStack>
      </Grid>

      {/* Trust row */}
      <Grid templateColumns="90px 1fr 1fr" gap={3} py={3} alignItems="center">
        <Text fontSize="11px" color="#64748B" fontWeight="500" lineHeight="1.4">Trust Score</Text>
        <Text fontSize="16px" color="#CBD5E1" fontWeight="600" textAlign="right" letterSpacing="-0.02em" lineHeight="1">3.2/10</Text>
        <HStack justify="flex-end" spacing={1.5}>
          <Text fontSize="16px" color="#0F172A" fontWeight="600" letterSpacing="-0.02em" lineHeight="1">8.7/10</Text>
          <Icon as={CheckCircle} w={3} h={3} color="#10B981" />
    </HStack>
      </Grid>
    </VStack>
  </Box>
)

// SaaS 4: LinkedIn Posts - Sleek social mockup
const LinkedInPosts = () => (
  <Box h="200px" px={6} pt={6} pb={4}>
    {/* Header */}
    <Flex justify="space-between" align="center" mb={5}>
      <Text fontSize="11px" fontWeight="500" color="#64748B" letterSpacing="0.03em">RECENT MENTIONS</Text>
      <Box bg="#0A66C2" w="14px" h="14px" rounded="3px" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="8px" color="white" fontWeight="bold">in</Text>
      </Box>
    </Flex>

    {/* Post cards - minimal */}
    <VStack spacing={4} align="stretch">
      {[
        { name: 'Sarah Chen', handle: '@sarahtech', text: 'Just tried @YourSaaS - the onboarding is incredible.' },
        { name: 'Alex Rivera', handle: '@alexbuilds', text: 'This tool saved me 10 hours this week.' },
    ].map((post, i) => (
        <Box key={i} borderBottom={i < 1 ? "1px solid #F1F5F9" : "none"} pb={i < 1 ? 4 : 0}>
          <Flex align="start" gap={2.5} mb={2}>
            <Box w="20px" h="20px" bg={`rgba(59, 130, 246, ${0.08 + i * 0.04})`} rounded="full" flexShrink={0} mt={0.5} />
          <Box flex="1">
              <HStack spacing={1.5} mb={1.5}>
                <Text fontSize="11px" fontWeight="600" color="#0F172A" lineHeight="1">{post.name}</Text>
                <Text fontSize="10px" color="#94A3B8" lineHeight="1">{post.handle}</Text>
              </HStack>
              <Text fontSize="11px" color="#64748B" lineHeight="1.6">
                {post.text}
              </Text>
          </Box>
          </Flex>
          {/* Engagement metrics */}
          <Flex gap={3} ml="28px" fontSize="9px" color="#94A3B8" mt={2}>
            <HStack spacing={1}>
              <Icon as={TrendingUp} w={2.5} h={2.5} />
              <Text>24 likes</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={Users} w={2.5} h={2.5} />
              <Text>8 comments</Text>
            </HStack>
        </Flex>
      </Box>
    ))}
  </VStack>
  </Box>
)

// Creators 1: Earnings - Transaction history widget
const BrandLogoGrid = () => {
  const [earnings, setEarnings] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const duration = 2000
          const target = 4280
          const steps = 60
          const increment = target / steps
          let current = 0
          
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setEarnings(target)
              clearInterval(timer)
            } else {
              setEarnings(current)
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
    <Box h="200px" px={6} pt={6} pb={4} ref={ref}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={5}>
        <Text fontSize="10px" fontWeight="500" color="#64748B" letterSpacing="0.05em" lineHeight="1">EARNINGS (30D)</Text>
        <Icon as={Banknote} w={3.5} h={3.5} color="#10B981" flexShrink={0} />
      </Flex>

      {/* Total display */}
      <Box bg="#F0FDF4" border="1px solid #D1FAE5" rounded="6px" p={3} mb={5}>
        <Text fontSize="9px" color="#059669" fontWeight="500" mb={2} lineHeight="1">Total Earned</Text>
        <Text fontSize="24px" fontWeight="600" color="#10B981" letterSpacing="-0.02em" lineHeight="1">
          ${Math.round(earnings).toLocaleString()}
        </Text>
      </Box>

    {/* Transaction list - minimal */}
    <VStack spacing={0} align="stretch">
      {[
        { brand: 'Stripe', amount: 1200, date: '3 days ago' },
        { brand: 'Notion', amount: 950, date: '1 week ago' },
      ].map((tx, i) => (
        <Flex
          key={i}
          justify="space-between"
          align="center"
          py={4}
          borderBottom={i < 1 ? "1px solid #F1F5F9" : "none"}
        >
          <HStack spacing={3} flex="1" minW={0}>
            <Box w="5px" h="5px" bg="#10B981" rounded="full" flexShrink={0} />
            <Box minW={0}>
              <Text fontSize="11px" fontWeight="600" color="#0F172A" lineHeight="1.2" mb={1.5}>{tx.brand}</Text>
              <Text fontSize="9px" color="#94A3B8" lineHeight="1.2">{tx.date}</Text>
            </Box>
    </HStack>
          <Text fontSize="12px" fontWeight="600" color="#10B981" letterSpacing="-0.01em" lineHeight="1" flexShrink={0} ml={4}>
            +${tx.amount}
          </Text>
  </Flex>
      ))}
    </VStack>
  </Box>
  )
}

// Creators 2: Payouts - Escrow status widget
const PayoutCard = () => {
  const [escrow, setEscrow] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const duration = 2000
          const target = 2130
          const steps = 60
          const increment = target / steps
          let current = 0
          
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setEscrow(target)
              clearInterval(timer)
            } else {
              setEscrow(current)
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
    <Box h="200px" px={6} pt={6} pb={4} ref={ref}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={5}>
        <Text fontSize="10px" fontWeight="500" color="#64748B" letterSpacing="0.05em" lineHeight="1">PAYMENT STATUS</Text>
        <Icon as={Lock} w={3.5} h={3.5} color="#10B981" flexShrink={0} />
      </Flex>

      {/* Escrow balance */}
      <Box bg="#F8FAFC" border="1px solid #F1F5F9" rounded="6px" p={3} mb={5}>
        <Flex justify="space-between" align="center" mb={2.5}>
          <Text fontSize="9px" color="#64748B" fontWeight="500" lineHeight="1">In Escrow</Text>
          <Box bg="#ECFDF5" px={2} py={1} rounded="3px">
            <Text fontSize="8px" color="#059669" fontWeight="600" lineHeight="1">PROTECTED</Text>
          </Box>
        </Flex>
        <Text fontSize="22px" fontWeight="600" color="#0F172A" letterSpacing="-0.02em" lineHeight="1" my={2}>
          ${Math.round(escrow).toLocaleString()}
        </Text>
        <Text fontSize="9px" color="#94A3B8" lineHeight="1.3" mt={2}>Released after approval</Text>
      </Box>

    {/* Timeline */}
    <VStack spacing={5} align="stretch">
      {[
        { step: 'Campaign launched', status: 'done', time: '2d ago' },
        { step: 'Payout released', status: 'pending', time: '~8h' },
      ].map((item, i) => (
        <Flex key={i} gap={3} align="start">
          <Box
            w="10px"
            h="10px"
            flexShrink={0}
            border="1.5px solid"
            borderColor={item.status === 'done' ? '#10B981' : '#E5E7EB'}
            bg={item.status === 'done' ? '#ECFDF5' : 'white'}
            rounded="full"
            mt="2px"
            position="relative"
          >
            {item.status === 'done' && (
              <Box w="4px" h="4px" bg="#10B981" rounded="full" position="absolute" top="1.5px" left="1.5px" />
            )}
          </Box>
          <Box flex="1" minW={0}>
            <Text 
              fontSize="11px" 
              fontWeight={item.status === 'pending' ? '600' : '500'} 
              color={item.status === 'pending' ? '#0F172A' : '#64748B'}
              lineHeight="1.3"
              mb={1.5}
            >
              {item.step}
            </Text>
            <Text fontSize="9px" color="#94A3B8" lineHeight="1.2">{item.time}</Text>
    </Box>
  </Flex>
      ))}
    </VStack>
  </Box>
  )
}

// Creators 3: Community - Member activity widget
const CommunityVisual = () => {
  const [members, setMembers] = useState(0)
  const [online, setOnline] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const duration = 2000
          
          // Members counter
          const targetMembers = 1247
          const stepsMembers = 60
          const incrementMembers = targetMembers / stepsMembers
          let currentMembers = 0
          
          const timerMembers = setInterval(() => {
            currentMembers += incrementMembers
            if (currentMembers >= targetMembers) {
              setMembers(targetMembers)
              clearInterval(timerMembers)
            } else {
              setMembers(currentMembers)
            }
          }, duration / stepsMembers)

          // Online counter
          const targetOnline = 342
          const stepsOnline = 60
          const incrementOnline = targetOnline / stepsOnline
          let currentOnline = 0
          
          const timerOnline = setInterval(() => {
            currentOnline += incrementOnline
            if (currentOnline >= targetOnline) {
              setOnline(targetOnline)
              clearInterval(timerOnline)
            } else {
              setOnline(currentOnline)
            }
          }, duration / stepsOnline)
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
    <Box h="200px" px={6} pt={6} pb={4} ref={ref}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="10px" fontWeight="500" color="#64748B" letterSpacing="0.05em" lineHeight="1">COMMUNITY</Text>
        <Icon as={Users} w={3.5} h={3.5} color="#3B82F6" flexShrink={0} />
      </Flex>

      {/* Member count */}
      <Flex gap={2.5} mb={4}>
        <Box flex="1" bg="#F8FAFC" border="1px solid #F1F5F9" rounded="6px" p={2.5}>
          <Text fontSize="18px" fontWeight="600" color="#0F172A" letterSpacing="-0.02em" lineHeight="1" mb={2}>
            {Math.round(members).toLocaleString()}
          </Text>
          <Text fontSize="9px" color="#64748B" lineHeight="1">Members</Text>
        </Box>
        <Box flex="1" bg="#EFF6FF" border="1px solid #DBEAFE" rounded="6px" p={2.5}>
          <Text fontSize="18px" fontWeight="600" color="#3B82F6" letterSpacing="-0.02em" lineHeight="1" mb={2}>
            {Math.round(online)}
          </Text>
          <Text fontSize="9px" color="#64748B" lineHeight="1">Online now</Text>
        </Box>
      </Flex>

    {/* Recent activity */}
    <VStack spacing={0} align="stretch">
      <Text fontSize="9px" color="#94A3B8" fontWeight="500" letterSpacing="0.05em" textTransform="uppercase" mb={3} lineHeight="1">
        RECENT ACTIVITY
      </Text>
      {[
        { user: 'Alex R.', action: 'shared a template', time: '2m' },
        { user: 'Sarah M.', action: 'posted in #tips', time: '12m' },
      ].map((activity, i) => (
        <Flex
            key={i}
          justify="space-between"
          align="start"
          py={2.5}
          borderBottom={i < 1 ? "1px solid #F1F5F9" : "none"}
        >
          <HStack spacing={2.5} flex="1" minW={0}>
            <Box w="16px" h="16px" bg={`rgba(59, 130, 246, ${0.1 + i * 0.05})`} rounded="full" flexShrink={0} />
            <Box flex="1" minW={0}>
              <Text fontSize="11px" color="#0F172A" fontWeight="500" lineHeight="1.2" mb={1}>{activity.user}</Text>
              <Text fontSize="9px" color="#64748B" lineHeight="1.3">{activity.action}</Text>
            </Box>
          </HStack>
          <Text fontSize="9px" color="#94A3B8" flexShrink={0} lineHeight="1" ml={3}>{activity.time}</Text>
        </Flex>
      ))}
    </VStack>
  </Box>
  )
}

// Creators 4: Success - Growth chart widget
const SuccessStories = () => (
  <Box h="200px" px={6} pt={6} pb={4}>
    {/* Header */}
    <Flex justify="space-between" align="center" mb={4}>
      <Text fontSize="10px" fontWeight="500" color="#64748B" letterSpacing="0.05em" lineHeight="1">INCOME GROWTH</Text>
      <Icon as={TrendingUp} w={3.5} h={3.5} color="#10B981" flexShrink={0} />
    </Flex>

    {/* Stats grid */}
    <Flex gap={2.5} mb={4}>
      <Box flex="1" bg="#ECFDF5" border="1px solid #D1FAE5" rounded="6px" p={2.5}>
        <Text fontSize="18px" fontWeight="600" color="#10B981" letterSpacing="-0.02em" lineHeight="1" mb={2}>
          +180%
        </Text>
        <Text fontSize="9px" color="#059669" fontWeight="500" lineHeight="1">Avg. Growth</Text>
      </Box>
      <Box flex="1" bg="#F8FAFC" border="1px solid #F1F5F9" rounded="6px" p={2.5}>
        <Text fontSize="18px" fontWeight="600" color="#0F172A" letterSpacing="-0.02em" lineHeight="1" mb={2}>
          4.8/5
        </Text>
        <Text fontSize="9px" color="#64748B" lineHeight="1">Satisfaction</Text>
      </Box>
    </Flex>

    {/* Mini area chart */}
    <Box position="relative" h="65px" mb={2.5}>
      <svg viewBox="0 0 200 60" width="100%" height="100%">
        <defs>
          <linearGradient id="successGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Area fill */}
        <motion.path
          d="M0,45 L20,42 L40,38 L60,35 L80,30 L100,28 L120,22 L140,18 L160,12 L180,8 L200,5 L200,60 L0,60 Z"
          fill="url(#successGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        {/* Line */}
        <motion.path
          d="M0,45 L20,42 L40,38 L60,35 L80,30 L100,28 L120,22 L140,18 L160,12 L180,8 L200,5"
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
    </Box>

    {/* Period labels */}
    <Flex justify="space-between" fontSize="9px" color="#94A3B8" lineHeight="1">
      <Text>Month 1</Text>
      <Text>Month 6</Text>
      <Text>Month 12</Text>
      </Flex>
  </Box>
)

const benefitsData = {
  saas: [
    { icon: ShieldCheck, title: 'Vetted Nano Influencers', description: 'Access 500+ verified tech creators with 1-50k engaged followers across LinkedIn, Instagram, and X.', visual: <TalentVisual /> },
    { icon: BarChart3, title: 'Performance Tracking', description: 'Real-time analytics dashboard. Track conversions, engagement, and ROI with precision.', visual: <PerformanceCurve /> },
    { icon: Zap, title: 'Why Nano Influencers', description: '8.2% engagement vs 1.7% for macros. €32 vs €145 per conversion. The data speaks for itself.', visual: <NanoInfluencersVisual /> },
    { icon: Video, title: 'UGC That Converts', description: 'Authentic creator posts that drive real engagement and trust with your target audience.', visual: <LinkedInPosts /> },
  ],
  creators: [
    { icon: Banknote, title: 'High-Ticket SaaS Deals', description: 'Earn $500-$3k per campaign working with premium tech brands that value quality content.', visual: <BrandLogoGrid /> },
    { icon: Lock, title: 'Guaranteed Payouts', description: 'Funds released within 24h via escrow. No invoice chasing, no payment delays.', visual: <PayoutCard /> },
    { icon: Users, title: 'Creator Community', description: 'Join 1,200+ active creators. Access exclusive resources, support, and networking.', visual: <CommunityVisual /> },
    { icon: TrendingUp, title: 'Proven Income Growth', description: 'Creators see +180% average income growth. Join the fastest-growing creator network.', visual: <SuccessStories /> },
  ],
}

export const BenefitsSection = () => {
  const [activeTab, setActiveTab] = useState<'saas' | 'creators'>('saas')

  return (
    <Box as="section" py={{ base: 16, md: 24 }} bg="#F8FAFC" position="relative">
      {/* Dot Grid Background */}
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        sx={{
          backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      
      <Container maxW="container.xl" position="relative" zIndex={1}>
        {/* Header */}
        <Box textAlign="center" mb={12}>
          <Heading
            as="h2"
            fontSize={{ base: '32px', md: '40px', lg: '44px' }}
            fontWeight="700"
            color="#0F172A"
            letterSpacing="-0.03em"
            lineHeight="1.15"
            mb={4}
          >
            The Unfair Advantage for Modern Growth
          </Heading>
          <Text fontSize="16px" color="#64748B" lineHeight="1.65" maxW="600px" mx="auto" mb={8}>
            Everything you need to scale your reach with authentic creator partnerships.
          </Text>

          {/* Toggle */}
          <Flex gap={4} justify="center">
            {['saas', 'creators'].map((tab) => {
              const isActive = activeTab === tab
              return (
                <Box
                  key={tab}
                  as="button"
                  onClick={() => setActiveTab(tab as 'saas' | 'creators')}
                  px={6}
                  py={3}
                  rounded="8px"
                  bg={isActive ? '#3B82F6' : 'white'}
                  color={isActive ? 'white' : '#64748B'}
                  fontSize="15px"
                  fontWeight="600"
                  border="1px solid"
                  borderColor={isActive ? '#3B82F6' : '#E5E7EB'}
                  transition="all 0.2s"
                  _hover={{
                    bg: isActive ? '#2563EB' : '#F8FAFC',
                    borderColor: isActive ? '#2563EB' : '#CBD5E1',
                  }}
                  _focus={{ outline: 'none' }}
                >
                  {tab === 'saas' ? 'For SaaS' : 'For Creators'}
                </Box>
              )
            })}
          </Flex>
        </Box>

        {/* 2x2 Grid */}
        <AnimatePresence mode="wait">
          <Grid
            key={activeTab}
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap={6}
            maxW="1200px"
            mx="auto"
          >
            {benefitsData[activeTab].map((benefit, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                bg="#FFFFFF"
                rounded="12px"
                overflow="hidden"
                border="1px solid #E5E7EB"
                sx={{
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: '0 16px 32px rgba(59, 130, 246, 0.15)',
                  borderColor: '#3B82F6',
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <Box bg="#FFFFFF" height="220px" maxH="220px" overflow="hidden">
                  {benefit.visual}
                </Box>
                <Box p={6} borderTop="1px solid #F1F5F9">
                  <Flex align="start" gap={3}>
                    <Icon as={benefit.icon} w={5} h={5} color="#3B82F6" mt={1} flexShrink={0} />
                    <Box flex="1">
                      <Heading size="sm" color="#0F172A" mb={2} fontWeight="600" lineHeight="1.4">
                        {benefit.title}
                      </Heading>
                      <Text fontSize="14px" color="#64748B" lineHeight="1.7">
                        {benefit.description}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            ))}
          </Grid>
        </AnimatePresence>
      </Container>
    </Box>
  )
}
