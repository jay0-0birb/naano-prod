'use client'

import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { Navbar } from '../components/navbar'
import { TestimonialsAndFAQ } from '../components/testimonials-faq-section'
import { FooterSection } from '../components/footer-section'

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      
      {/* About Header */}
      <Box pt={{ base: 32, md: 40 }} pb={{ base: 12, md: 20 }} bg="white">
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center" maxW="3xl" mx="auto">
            <Heading
              as="h1"
              fontSize={{ base: "4xl", md: "6xl" }}
              fontWeight="800"
              color="#111827"
              letterSpacing="-0.03em"
            >
              We're changing how brands connect with creators.
            </Heading>
            <Text fontSize="xl" color="gray.500" lineHeight="1.6">
              Naano is the first performance-based marketplace for B2B nano-influencers. 
              We believe in authenticity over follower counts.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials moved here */}
      <TestimonialsAndFAQ />
      
      <FooterSection />
    </main>
  )
}

