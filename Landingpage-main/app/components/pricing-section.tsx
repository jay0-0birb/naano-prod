'use client'

import { useState } from 'react'
import { Box, Container, Heading, Text, Flex, VStack, HStack, Button, Icon, Badge, SimpleGrid, List, ListItem } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

const MotionBox = motion(Box)

const saasPricing = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for testing creator marketing.',
    features: ['3 active campaigns', 'Basic analytics', '10 creator invites/mo', 'Email support'],
    highlight: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    price: 149,
    description: 'Scale your SaaS with consistent content.',
    features: ['Unlimited campaigns', 'Advanced analytics', 'Unlimited invites', 'Priority support', 'Dedicated manager'],
    highlight: true,
    cta: 'Get Started',
  },
  {
    name: 'Scale',
    price: 399,
    description: 'For teams managing multiple brands.',
    features: ['Everything in Growth', 'Multi-brand dashboard', 'API access', 'Custom contracts', 'White-label reports'],
    highlight: false,
    cta: 'Contact Sales',
  },
]

export const PricingSection = () => {
  const [activeTab, setActiveTab] = useState<'saas' | 'creators'>('saas')

  return (
    <Box as="section" py={{ base: 16, md: 24 }} bg="white" position="relative">
      {/* Subtle dot grid */}
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
        {/* Header */}
        <VStack spacing={4} textAlign="center" mb={12}>
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="700"
            color="#0F172A"
            letterSpacing="-0.03em"
            lineHeight="1.15"
          >
            Simple, transparent pricing
          </Heading>
          <Text fontSize="lg" color="#64748B" maxW="lg">
            No hidden fees. Start for free and upgrade as you grow.
          </Text>

          {/* Toggle */}
          <Flex
            bg="#F1F5F9"
            p={1}
            rounded="full"
            mt={6}
          >
            {['saas', 'creators'].map((tab) => {
              const isActive = activeTab === tab
              return (
                <Box
                  key={tab}
                  as="button"
                  onClick={() => setActiveTab(tab as 'saas' | 'creators')}
                  px={6}
                  py={2.5}
                  rounded="full"
                  fontSize="14px"
                  fontWeight="600"
                  color={isActive ? "#0F172A" : "#64748B"}
                  bg={isActive ? "white" : "transparent"}
                  boxShadow={isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none"}
                  transition="all 0.2s"
                  _hover={{ color: "#0F172A" }}
                >
                  {tab === 'saas' ? 'For Brands' : 'For Creators'}
                </Box>
              )
            })}
          </Flex>
        </VStack>

        <AnimatePresence mode="wait">
          {activeTab === 'saas' ? (
            <MotionBox
              key="saas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} maxW="1000px" mx="auto">
                {saasPricing.map((plan, index) => (
                  <Box
                    key={plan.name}
                    position="relative"
                    bg="white"
                    rounded="16px"
                    border={plan.highlight ? '2px solid #0F172A' : '1px solid #E5E7EB'}
                    p={6}
                    display="flex"
                    flexDirection="column"
                    _hover={{
                      borderColor: plan.highlight ? '#0F172A' : '#CBD5E1',
                    }}
                    transition="all 0.2s ease"
                  >
                    {plan.highlight && (
                      <Badge 
                        position="absolute" 
                        top="-12px" 
                        left="50%" 
                        transform="translateX(-50%)"
                        bg="#0F172A"
                        color="white"
                        px={3}
                        py={1}
                        rounded="full"
                        fontSize="11px"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        Popular
                      </Badge>
                    )}

                    {/* Plan Name */}
                    <Text fontSize="sm" fontWeight="600" color="#64748B" mb={1}>
                      {plan.name}
                    </Text>

                    {/* Price */}
                    <Flex align="baseline" mb={2}>
                      <Text fontSize="4xl" fontWeight="700" color="#0F172A" letterSpacing="-0.03em">
                        ${plan.price}
                      </Text>
                      <Text fontSize="sm" color="#94A3B8" ml={1}>/month</Text>
                    </Flex>

                    {/* Description */}
                    <Text fontSize="14px" color="#64748B" mb={6} lineHeight="1.5">
                      {plan.description}
                    </Text>

                    {/* CTA */}
                    <Button
                      w="full"
                      h="44px"
                      bg={plan.highlight ? '#0F172A' : 'white'}
                      color={plan.highlight ? 'white' : '#0F172A'}
                      border="1px solid"
                      borderColor={plan.highlight ? '#0F172A' : '#E5E7EB'}
                      rounded="10px"
                      fontSize="14px"
                      fontWeight="600"
                      mb={6}
                      _hover={{
                        bg: plan.highlight ? '#1E293B' : '#F8FAFC',
                      }}
                      transition="all 0.2s"
                    >
                      {plan.cta}
                    </Button>

                    {/* Features */}
                    <VStack align="stretch" spacing={3} pt={6} borderTop="1px solid #F1F5F9">
                      {plan.features.map((feature) => (
                        <HStack key={feature} spacing={3} align="start">
                          <Box 
                            mt={0.5}
                            color="#10B981"
                          >
                            <Check size={16} strokeWidth={2.5} />
                          </Box>
                          <Text fontSize="13px" color="#475569">{feature}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </MotionBox>
          ) : (
            <MotionBox
              key="creators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              maxW="600px"
              mx="auto"
            >
              <Box
                bg="#F8FAFC"
                rounded="20px"
                p={{ base: 8, md: 12 }}
                textAlign="center"
                border="1px solid #E5E7EB"
              >
                {/* Free Badge */}
                <Badge
                  bg="#ECFDF5"
                  color="#059669"
                  px={4}
                  py={1.5}
                  rounded="full"
                  fontSize="sm"
                  fontWeight="600"
                  mb={6}
                >
                  Free to join
                </Badge>

                <Heading 
                  as="h3" 
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="700" 
                  color="#0F172A"
                  mb={4}
                >
                  $0 to get started
                </Heading>

                <Text color="#64748B" fontSize="lg" mb={8} lineHeight="1.7">
                  We take a small commission on your earnings — only when you get paid.
                </Text>

                {/* Simple benefits */}
                <VStack spacing={3} mb={8}>
                  {['No upfront costs', 'Access to premium SaaS brands', 'Get paid for what you love'].map((item) => (
                    <HStack key={item} spacing={2}>
                      <Box color="#10B981">
                        <Check size={18} strokeWidth={2.5} />
                      </Box>
                      <Text fontSize="15px" color="#475569">{item}</Text>
                    </HStack>
                  ))}
                </VStack>

                <Button
                  variant="link"
                  color="#0F172A"
                  fontSize="15px"
                  fontWeight="600"
                  rightIcon={<Icon as={ArrowRight} w={4} h={4} />}
                  _hover={{ color: '#3B82F6' }}
                  transition="all 0.2s"
                >
                  Create your profile
                </Button>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  )
}
