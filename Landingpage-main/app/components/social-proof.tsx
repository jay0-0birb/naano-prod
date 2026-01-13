'use client'

import { Box, Container, Text, Flex, Icon } from '@chakra-ui/react'

const PARTNERS = [
  'Vercel',
  'Linear',
  'Stripe',
  'Loom',
  'Notion',
  'Figma',
]

export const SocialProofSection = () => {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} bg="bg.main" overflow="hidden">
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <Container maxW="container.xl">
        <Text
          textAlign="center"
          fontSize="xs"
          fontWeight="medium"
          letterSpacing="wider"
          color="text.light"
          textTransform="uppercase"
          mb={10}
        >
          Trusted by 500+ SaaS Brands & Nano Influencers
        </Text>

        <Box position="relative" w="full" overflow="hidden">
          {/* Fade masks */}
          <Box
            position="absolute"
            left="0"
            top="0"
            bottom="0"
            w="80px"
            bgGradient="linear(to-r, bg.main, transparent)"
            zIndex="2"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            right="0"
            top="0"
            bottom="0"
            w="80px"
            bgGradient="linear(to-l, bg.main, transparent)"
            zIndex="2"
            pointerEvents="none"
          />

          {/* Marquee */}
          <Flex
            w="max-content"
            animation="scroll 25s linear infinite"
            _hover={{ animationPlayState: 'paused' }}
            sx={{ willChange: 'transform' }}
          >
            {[...Array(4)].map((_, i) => (
              <Flex key={i} align="center" gap={16} pr={16}>
                {PARTNERS.map((partner, index) => (
                  <Text
                    key={`${i}-${index}`}
                    fontSize="lg"
                    fontWeight="semibold"
                    color="gray.300"
                    _hover={{ color: 'brand.primary' }}
                    transition="color 0.3s"
                    cursor="default"
                  >
                    {partner}
                  </Text>
                ))}
              </Flex>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
  )
}
