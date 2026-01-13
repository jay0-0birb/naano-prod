'use client'

import { Box, Container, Heading, Text, Flex, VStack, HStack, Avatar, Badge, Button, Icon } from '@chakra-ui/react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Heart, MessageCircle, Repeat2, CheckCircle, Linkedin, Users } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

const MotionBox = motion(Box)

// Step 1: Match Card
const MatchCard = () => (
  <Box 
    bg="white" 
    rounded="16px" 
    border="1px solid #E5E7EB" 
    p={5} 
    maxW="260px" 
    mx="auto"
    position="relative"
    sx={{
      boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.08)',
    }}
  >
    {/* Verified Badge */}
    <Box position="absolute" top={4} right={4}>
      <Icon as={CheckCircle} w={5} h={5} color="#3B82F6" />
    </Box>

    {/* Profile Header */}
    <Flex align="center" mb={4}>
      <Box position="relative">
        <Avatar 
          src="https://i.pravatar.cc/150?img=17" 
          size="md" 
          border="2px solid white"
          boxShadow="0 2px 8px rgba(0,0,0,0.1)"
        />
        <Box
          position="absolute"
          bottom="0"
          right="0"
          w="18px"
          h="18px"
          bg="#0A66C2"
          rounded="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="2px solid white"
        >
          <Icon as={Linkedin} w={2.5} h={2.5} color="white" />
        </Box>
      </Box>
      <Box ml={3} flex="1">
        <Text fontWeight="600" fontSize="15px" color="#0F172A" lineHeight="1.3">Alex Rivera</Text>
        <Text fontSize="12px" color="#64748B">Tech Creator</Text>
      </Box>
    </Flex>

    {/* Stats */}
    <Flex gap={4} mb={4} pb={4} borderBottom="1px solid #F1F5F9">
      <HStack spacing={1}>
        <Icon as={Users} w={3.5} h={3.5} color="#9CA3AF" />
        <Text fontSize="12px" color="#0F172A" fontWeight="600">12.4k</Text>
      </HStack>
      <HStack spacing={1}>
        <Box w="6px" h="6px" bg="#10B981" rounded="full" />
        <Text fontSize="12px" color="#64748B">8.2% eng.</Text>
      </HStack>
    </Flex>

    {/* Tags */}
    <Flex gap={2} mb={4} flexWrap="wrap">
      <Badge 
        bg="#F1F5F9" 
        color="#475569" 
        fontSize="11px" 
        fontWeight="500"
        px={2.5}
        py={1}
        rounded="full"
        textTransform="none"
      >
        React
      </Badge>
      <Badge 
        bg="#F1F5F9" 
        color="#475569" 
        fontSize="11px" 
        fontWeight="500"
        px={2.5}
        py={1}
        rounded="full"
        textTransform="none"
      >
        SaaS
      </Badge>
      <Badge 
        bg="#EFF6FF" 
        color="#3B82F6" 
        fontSize="11px" 
        fontWeight="500"
        px={2.5}
        py={1}
        rounded="full"
        textTransform="none"
      >
        B2B
      </Badge>
    </Flex>

    {/* CTA Button */}
    <Button 
      size="sm" 
      w="full" 
      bg="#0F172A"
      color="white"
      fontSize="13px"
      fontWeight="500"
      h="38px"
      rounded="8px"
      _hover={{ bg: '#1E293B' }}
    >
      View Profile
    </Button>
  </Box>
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
    <VStack spacing={3} maxW="280px" mx="auto" ref={ref}>
      {posts.map((post, i) => (
        <Box 
          key={i} 
          bg="white" 
          rounded="xl" 
          border="1px solid" 
          borderColor="gray.100" 
          p={3} 
          w="full"
          sx={{
            boxShadow: '0 16px 48px -12px rgba(59, 130, 246, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.04)',
          }}
        >
          <Flex align="center" mb={2}>
            <Avatar src={`https://i.pravatar.cc/150?img=${post.avatar}`} size="xs" mr={2} />
            <Text fontWeight="semibold" fontSize="xs" color="brand.primary">{post.handle}</Text>
          </Flex>
          <Text fontSize="xs" color="text.main" mb={2}>{post.text}</Text>
          <Flex gap={4} fontSize="xs" color="text.muted">
            <Flex align="center"><Icon as={Heart} w={3} h={3} mr={1} />{counts[i]?.likes || 0}</Flex>
            <Flex align="center"><Icon as={MessageCircle} w={3} h={3} mr={1} />{counts[i]?.comments || 0}</Flex>
            {counts[i]?.shares > 0 && <Flex align="center"><Icon as={Repeat2} w={3} h={3} mr={1} />{counts[i].shares}</Flex>}
          </Flex>
        </Box>
      ))}
    </VStack>
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
    <Box 
      ref={ref}
      bg="white" 
      rounded="xl" 
      border="1px solid" 
      borderColor="gray.100" 
      p={5} 
      maxW="240px" 
      mx="auto" 
      textAlign="center"
      sx={{
        boxShadow: '0 16px 48px -12px rgba(59, 130, 246, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.04)',
      }}
    >
      <Text fontSize="xs" color="text.muted" mb={2}>Campaign Results</Text>
      <Text fontSize="3xl" fontWeight="bold" color="brand.primary" mb={1}>
        ${revenue.toFixed(1)}k
      </Text>
      <Badge bg="blue.50" color="brand.accent" fontSize="xs">+24% Growth</Badge>
    </Box>
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
    <Box as="section" py={{ base: 16, md: 24 }} bg="white" position="relative" ref={ref}>
      {/* Dot Grid Background */}
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        sx={{
          backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <Container maxW="container.xl">
        {/* Header */}
        <VStack spacing={3} textAlign="center" mb={16}>
          <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" color="brand.primary">
            How It Works
          </Heading>
          <Text fontSize="md" color="text.muted" maxW="lg">
            Three simple steps from match to measurable growth.
          </Text>
        </VStack>

        {/* Steps */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'center', md: 'flex-start' }}
          gap={{ base: 12, md: 8 }}
          position="relative"
        >
          {steps.map((step, index) => (
            <Box key={index} flex="1" position="relative">
              <VStack spacing={4} align="center">
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {step.component}
                </MotionBox>

                <VStack spacing={2} textAlign="center" px={2}>
                  <Heading size="sm" color="brand.primary">{step.title}</Heading>
                  <Text fontSize="sm" color="text.muted" lineHeight="1.5">{step.description}</Text>
                </VStack>
              </VStack>

              {index < steps.length - 1 && (
                <Icon
                  as={ArrowRight}
                  position="absolute"
                  top="80px"
                  right={{ base: 'auto', md: '-30px' }}
                  color="gray.300"
                  w={5}
                  h={5}
                  display={{ base: 'none', md: 'block' }}
                />
              )}
            </Box>
          ))}
        </Flex>
      </Container>
    </Box>
  )
}
