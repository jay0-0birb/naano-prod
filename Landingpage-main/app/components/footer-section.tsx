'use client'

import { Box, Container, Heading, Text, Button, Flex, Link, Icon, HStack, VStack, Input, Grid } from '@chakra-ui/react'
import { ArrowRight, Twitter, Linkedin, Github } from 'lucide-react'

export const FooterSection = () => {
  return (
    <Box as="footer">
      {/* Final CTA - Ultra Minimal Newsletter */}
      <Box 
        bg="white" 
        py={{ base: 16, md: 24 }} 
        position="relative"
        overflow="hidden"
        borderTop="1px solid"
        borderColor="gray.100"
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Box
            maxW="600px"
            mx="auto"
            textAlign="center"
          >
            <Heading
              as="h2"
              fontSize={{ base: '32px', md: '48px' }}
              fontWeight="800"
              color="#111827"
              letterSpacing="-0.03em"
              lineHeight="1.1"
              mb={8}
            >
              Ready to scale with{' '}
              <Text as="span" color="#3B82F6">
                nano-creators
              </Text>
              ?
            </Heading>

            {/* Newsletter Input Group */}
            <Flex 
              as="form" 
              gap={3} 
              direction={{ base: 'column', sm: 'row' }}
              maxW="480px"
              mx="auto"
            >
              <Input
                placeholder="Enter your email"
                h="52px"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                rounded="full"
                fontSize="16px"
                px={6}
                _focus={{ 
                  borderColor: '#3B82F6', 
                  bg: 'white',
                  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)' 
                }}
                _placeholder={{ color: 'gray.400' }}
                _hover={{ borderColor: 'gray.300' }}
                transition="all 0.2s"
              />
              <Button
                h="52px"
                px={8}
                bg="#111827"
                color="white"
                rounded="full"
                fontSize="15px"
                fontWeight="600"
                flexShrink={0}
                _hover={{ 
                  bg: '#1F2937', 
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg'
                }}
                transition="all 0.2s"
              >
                Get Started
              </Button>
            </Flex>

            <Text fontSize="13px" color="gray.400" mt={4}>
              Join our weekly newsletter. No spam, ever.
            </Text>
          </Box>
        </Container>
      </Box>

      {/* Footer - Organized Grid with Large Branding */}
      <Box bg="#0F172A" pt={20} pb={8} position="relative" overflow="hidden">
        {/* Massive NAANO Branding */}
        <Box
          position="absolute"
          bottom="-60px"
          left="50%"
          transform="translateX(-50%)"
          w="100%"
          textAlign="center"
          pointerEvents="none"
          userSelect="none"
          zIndex="0"
        >
          <Text
            fontSize={{ base: '20vw', md: '16vw', lg: '14vw' }}
            fontWeight="900"
            color="rgba(255, 255, 255, 0.03)"
            lineHeight="1"
            letterSpacing="-0.05em"
          >
            NAANO
          </Text>
        </Box>

        <Container maxW="container.xl" position="relative" zIndex={1}>
          {/* Footer Grid */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
            gap={10}
            mb={16}
          >
            {/* Column 1: Brand */}
            <VStack align="start" spacing={5}>
              <Text fontSize="24px" fontWeight="700" color="white" letterSpacing="-0.03em">
                Naano
              </Text>
              <Text fontSize="14px" color="rgba(255, 255, 255, 0.6)" lineHeight="1.7" maxW="280px">
                The first B2B marketplace connecting SaaS brands with vetted nano-influencers.
              </Text>
              <HStack spacing={3} pt={2}>
                {[Twitter, Linkedin, Github].map((SocialIcon, i) => (
                  <Link key={i} href="#" _hover={{ textDecor: 'none' }}>
                    <Box
                      w="40px"
                      h="40px"
                      bg="rgba(255, 255, 255, 0.05)"
                      rounded="8px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      _hover={{ bg: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6' }}
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      transition="all 0.2s"
                    >
                      <Icon as={SocialIcon} w={4} h={4} color="rgba(255, 255, 255, 0.7)" />
                    </Box>
                  </Link>
                ))}
              </HStack>
            </VStack>

            {/* Column 2: Product */}
            <VStack align="start" spacing={3}>
              <Text fontSize="11px" fontWeight="600" color="rgba(255, 255, 255, 0.9)" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                Product
              </Text>
              {['Features', 'Pricing', 'Creators', 'Analytics', 'API'].map((item) => (
                <Link key={item} href="#" fontSize="14px" color="rgba(255, 255, 255, 0.5)" _hover={{ color: 'white' }} transition="color 0.15s">
                  {item}
                </Link>
              ))}
            </VStack>

            {/* Column 3: Resources */}
            <VStack align="start" spacing={3}>
              <Text fontSize="11px" fontWeight="600" color="rgba(255, 255, 255, 0.9)" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                Resources
              </Text>
              {['Documentation', 'Blog', 'Case Studies', 'Help Center', 'Status'].map((item) => (
                <Link key={item} href="#" fontSize="14px" color="rgba(255, 255, 255, 0.5)" _hover={{ color: 'white' }} transition="color 0.15s">
                  {item}
                </Link>
              ))}
            </VStack>

            {/* Column 4: Company */}
            <VStack align="start" spacing={3}>
              <Text fontSize="11px" fontWeight="600" color="rgba(255, 255, 255, 0.9)" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                Company
              </Text>
              {['About', 'Careers', 'Legal', 'Privacy', 'Terms'].map((item) => (
                <Link key={item} href="#" fontSize="14px" color="rgba(255, 255, 255, 0.5)" _hover={{ color: 'white' }} transition="color 0.15s">
                  {item}
                </Link>
              ))}
            </VStack>
          </Grid>

          {/* Footer Bottom */}
          <Flex
            pt={8}
            borderTop="1px solid rgba(255, 255, 255, 0.1)"
            justify="space-between"
            align="center"
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Text fontSize="13px" color="rgba(255, 255, 255, 0.4)">
              © 2025 Naano Inc. All rights reserved.
            </Text>
            <HStack spacing={6} fontSize="13px" color="rgba(255, 255, 255, 0.4)">
              <Link href="#" _hover={{ color: 'white' }} transition="color 0.15s">Privacy</Link>
              <Link href="#" _hover={{ color: 'white' }} transition="color 0.15s">Terms</Link>
              <Link href="#" _hover={{ color: 'white' }} transition="color 0.15s">Cookies</Link>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}
