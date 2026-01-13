'use client'

import { useState, useEffect } from 'react'
import { Box, Container, Heading, Text, Button, Stack, Flex } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)
const MotionText = motion(Text)

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
    <Box 
      as="section" 
      minH="100vh" 
      position="relative" 
      overflow="hidden"
      bg="white"
    >
      <Container maxW="container.xl" position="relative" zIndex="2" pt={{ base: 28, md: 36 }} pb={{ base: 16, md: 24 }}>
        
        {/* Text Content */}
        <Box textAlign="center" maxW="800px" mx="auto" px={4} mb={{ base: 20, md: 28 }}>

          {/* Main Heading */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Heading
              as="h1"
              fontSize={{ base: "40px", md: "56px", lg: "68px" }}
              fontWeight="600"
              lineHeight="1.05"
              letterSpacing="-0.03em"
              color="#111827"
              mb={6}
            >
              <AnimatePresence mode="wait">
                <MotionText
                  key={words[currentWordIndex]}
                  as="span"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  display="inline-block"
                >
                  {words[currentWordIndex]}
                </MotionText>
              </AnimatePresence>
              {' '}your SaaS
              <br />
              <Text as="span">
                with{' '}
                <Text 
                  as="span" 
                  color="#3B82F6"
                  position="relative"
                >
                  nano-creators
                  <Box
                    as="span"
                    position="absolute"
                    bottom="-2px"
                    left="0"
                    right="0"
                    height="3px"
                    bg="#3B82F6"
                    opacity={0.3}
                    rounded="full"
                  />
                </Text>
                .
              </Text>
            </Heading>
          </MotionBox>

          {/* Subtitle */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            mb={10}
          >
            <Text
              fontSize={{ base: "17px", md: "19px" }}
              fontWeight="400"
              color="#4B5563"
              lineHeight="1.7"
              maxW="560px"
              mx="auto"
            >
              Access a curated network of vetted nano-influencers (1-50k).
              The first performance-based B2B marketplace.
            </Text>
          </MotionBox>

          {/* CTA Buttons */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} justify="center">
              <Button
                size="lg"
                h="56px"
                px={10}
                bg="#111827"
                color="white"
                rounded="full"
                fontWeight="500"
                fontSize="15px"
                _hover={{ 
                  bg: '#1F2937', 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 8px 30px 0 rgba(17, 24, 39, 0.25)'
                }}
                transition="all 0.2s ease"
              >
                Scale my Revenue
              </Button>
              <Button
                size="lg"
                h="56px"
                px={10}
                bg="white"
                color="#111827"
                rounded="full"
                border="1px solid #E5E7EB"
                fontWeight="500"
                fontSize="15px"
                _hover={{ 
                  borderColor: '#111827',
                  bg: '#F9FAFB'
                }}
                transition="all 0.2s ease"
              >
                Monetize my Audience
              </Button>
            </Stack>
          </MotionBox>
        </Box>

        {/* Logos Section - Prominent */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Text
            fontSize="12px"
            fontWeight="500"
            letterSpacing="0.1em"
            color="#9CA3AF"
            textTransform="uppercase"
            textAlign="center"
            mb={10}
          >
            Trusted by growth teams at
          </Text>

          <Flex
            justify="center"
            align="center"
            gap={{ base: 10, md: 16, lg: 20 }}
            flexWrap="wrap"
            maxW="1000px"
            mx="auto"
          >
            {['Vercel', 'Linear', 'Notion', 'Stripe', 'Loom', 'Figma'].map((brand) => (
              <Text
                key={brand}
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="600"
                color="#CBD5E1"
                _hover={{ color: '#64748B' }}
                transition="color 0.3s ease"
                cursor="default"
              >
                {brand}
              </Text>
            ))}
          </Flex>
        </MotionBox>

      </Container>
    </Box>
  )
}
