'use client'

import { Box } from '@chakra-ui/react'
import { Navbar } from '../components/navbar'
import { BenefitsSection } from '../components/benefits-section'
import { FooterSection } from '../components/footer-section'

export default function FeaturesPage() {
  return (
    <main>
      <Navbar />
      <Box pt={{ base: 20, md: 24 }}>
        <BenefitsSection />
      </Box>
      <FooterSection />
    </main>
  )
}

