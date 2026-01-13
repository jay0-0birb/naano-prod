'use client'

import { Box, Container, Heading, Text, Flex, VStack, Icon } from '@chakra-ui/react'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Zap, BarChart3, Target, ChevronLeft, ChevronRight } from 'lucide-react'

const MotionBox = motion(Box)

const features = [
  {
    icon: Zap,
    title: 'Viral-Ready Hooks',
    description: 'Our creators know how to stop the scroll with proven frameworks.',
  },
  {
    icon: BarChart3,
    title: 'Authentic Storytelling',
    description: 'Real experiences, real results. No generic ad copy.',
  },
  {
    icon: Target,
    title: 'Massive Reach',
    description: '100K+ impressions from accounts with just 2K followers.',
  },
]

const linkedInPosts = [
  {
    id: 1,
    src: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7393694568162160641',
  },
  {
    id: 2,
    src: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7402323007991422977',
  },
  {
    id: 3,
    src: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7396933551776038912',
  },
]

const PhoneMockup = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-scroll every 6 seconds
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === linkedInPosts.length - 1 ? 0 : prev + 1))
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused])

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? linkedInPosts.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev === linkedInPosts.length - 1 ? 0 : prev + 1))
  }

  return (
    <Flex align="center" gap={4}>
      {/* Left Arrow */}
      <Box
        as="button"
        w="44px"
        h="44px"
        rounded="full"
        bg="white"
        border="1px solid #E5E7EB"
        display={{ base: 'none', md: 'flex' }}
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={goToPrev}
        _hover={{ bg: '#F9FAFB', borderColor: '#3B82F6' }}
        transition="all 0.2s"
        boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        flexShrink={0}
      >
        <Icon as={ChevronLeft} w={5} h={5} color="#374151" />
      </Box>

      {/* Phone Frame */}
      <Box
        position="relative"
        w={{ base: '280px', md: '320px' }}
        h={{ base: '560px', md: '620px' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Simple phone bezel */}
        <Box
          position="absolute"
          inset={0}
          bg="#111827"
          rounded="32px"
          boxShadow="0 25px 60px -12px rgba(0, 0, 0, 0.3)"
          overflow="hidden"
          p="6px"
        >
          {/* Screen */}
          <Box
            w="full"
            h="full"
            bg="white"
            rounded="26px"
            overflow="hidden"
            position="relative"
          >
            {/* LinkedIn Posts */}
            {linkedInPosts.map((post, index) => (
              <Box
                key={post.id}
                position="absolute"
                top={0}
                left={0}
                w="full"
                h="full"
                opacity={activeIndex === index ? 1 : 0}
                transition="opacity 0.4s ease"
                pointerEvents={activeIndex === index ? 'auto' : 'none'}
              >
                <iframe
                  src={post.src}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title={`Post LinkedIn ${index + 1}`}
                  style={{
                    borderRadius: '26px',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Progress indicator */}
        <Flex
          position="absolute"
          bottom="-40px"
          left="50%"
          transform="translateX(-50%)"
          gap={2}
        >
          {linkedInPosts.map((_, index) => (
            <Box
              key={index}
              as="button"
              w={activeIndex === index ? "24px" : "8px"}
              h="8px"
              rounded="full"
              bg={activeIndex === index ? "#3B82F6" : "#E5E7EB"}
              transition="all 0.3s ease"
              onClick={() => setActiveIndex(index)}
              cursor="pointer"
              _hover={{ bg: activeIndex === index ? "#3B82F6" : "#CBD5E1" }}
            />
          ))}
        </Flex>

        {/* Mobile navigation arrows */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          position="absolute"
          bottom="-40px"
          left="0"
          right="0"
          justify="space-between"
          px={4}
        >
          <Box
            as="button"
            w="36px"
            h="36px"
            rounded="full"
            bg="white"
            border="1px solid #E5E7EB"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={goToPrev}
          >
            <Icon as={ChevronLeft} w={4} h={4} color="#374151" />
          </Box>
          <Box
            as="button"
            w="36px"
            h="36px"
            rounded="full"
            bg="white"
            border="1px solid #E5E7EB"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={goToNext}
          >
            <Icon as={ChevronRight} w={4} h={4} color="#374151" />
          </Box>
        </Flex>
      </Box>

      {/* Right Arrow */}
      <Box
        as="button"
        w="44px"
        h="44px"
        rounded="full"
        bg="#3B82F6"
        display={{ base: 'none', md: 'flex' }}
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={goToNext}
        _hover={{ bg: '#2563EB' }}
        transition="all 0.2s"
        boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
        flexShrink={0}
      >
        <Icon as={ChevronRight} w={5} h={5} color="white" />
      </Box>
    </Flex>
  )
}

export const CaseStudySection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <Box 
      as="section" 
      py={{ base: 16, md: 24 }} 
      bg="white" 
      position="relative" 
      ref={ref} 
      overflow="hidden"
    >
      {/* Subtle background pattern */}
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        sx={{
          backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <Container maxW="container.xl" position="relative" zIndex={1}>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'center', lg: 'center' }}
          justify="space-between"
          gap={{ base: 16, lg: 16 }}
        >
          {/* LEFT SIDE - Content & Methodology */}
          <MotionBox
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            flex="1"
            maxW={{ base: '100%', lg: '500px' }}
          >
            {/* Heading */}
            <Heading
              as="h2"
              fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
              fontWeight="700"
              color="#0F172A"
              letterSpacing="-0.03em"
              lineHeight="1.15"
              mb={5}
            >
              The Naano Framework:
              <br />
              <Text as="span" color="#3B82F6">Consistency meets Virality.</Text>
            </Heading>

            {/* Subheadline */}
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="#64748B"
              lineHeight="1.7"
              fontWeight="400"
              mb={10}
            >
              We don't just match you with creators. <Text as="span" fontWeight="600" color="#0F172A">We train them to write posts that convert specifically for SaaS.</Text>
            </Text>

            {/* Feature List */}
            <VStack spacing={5} align="stretch">
              {features.map((feature, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Flex gap={4} align="start">
                    {/* Icon */}
                    <Box
                      w="40px"
                      h="40px"
                      rounded="10px"
                      bg="#EFF6FF"
                      border="1px solid #DBEAFE"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={feature.icon} w={4} h={4} color="#3B82F6" />
                    </Box>

                    {/* Text */}
                    <Box pt={1}>
                      <Heading
                        as="h3"
                        fontSize="15px"
                        fontWeight="600"
                        color="#0F172A"
                        mb={1}
                      >
                        {feature.title}
                      </Heading>
                      <Text fontSize="14px" color="#64748B" lineHeight="1.6">
                        {feature.description}
                      </Text>
                    </Box>
                  </Flex>
                </MotionBox>
              ))}
            </VStack>

            {/* Stats callout */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              mt={10}
              p={5}
              bg="#F8FAFC"
              rounded="12px"
              border="1px solid #E5E7EB"
            >
              <Flex align="center" gap={2} mb={4}>
                <Box w="8px" h="8px" bg="#10B981" rounded="full" />
                <Text fontSize="12px" color="#64748B" fontWeight="500" letterSpacing="0.03em">
                  REAL RESULTS IN 3 WEEKS
                </Text>
              </Flex>
              <Flex gap={4} align="center" justify="space-between" flexWrap="wrap">
                <VStack spacing={0} align="start">
                  <Text fontSize="24px" fontWeight="700" color="#0F172A" letterSpacing="-0.02em">1K</Text>
                  <Text fontSize="11px" color="#64748B">followers</Text>
                </VStack>
                <Text color="#CBD5E1" fontSize="xl">→</Text>
                <VStack spacing={0} align="start">
                  <Text fontSize="24px" fontWeight="700" color="#10B981" letterSpacing="-0.02em">3.5K</Text>
                  <Text fontSize="11px" color="#64748B">followers</Text>
                </VStack>
                <Box w="1px" h="40px" bg="#E5E7EB" display={{ base: 'none', sm: 'block' }} />
                <VStack spacing={0} align="start">
                  <Text fontSize="24px" fontWeight="700" color="#3B82F6" letterSpacing="-0.02em">200K+</Text>
                  <Text fontSize="11px" color="#64748B">views</Text>
                </VStack>
              </Flex>
            </MotionBox>
          </MotionBox>

          {/* RIGHT SIDE - Phone Mockup with real posts */}
          <MotionBox
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            flex="1"
            display="flex"
            justifyContent="center"
            pb={{ base: 12, lg: 0 }}
          >
            <PhoneMockup />
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  )
}
