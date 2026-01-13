'use client'

import { Box, Container, Heading, VStack, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'

const faqs = [
  { question: 'How do you vet the creators?', answer: 'Every creator is manually verified. We review their GitHub contributions, LinkedIn profile, audience engagement metrics, and content quality. Only the top 1% make it through.' },
  { question: 'Is it really free for creators?', answer: 'Yes, absolutely. We charge a service fee to the brands, not the talent. You keep 100% of your negotiated rate.' },
  { question: 'Who owns the content rights?', answer: 'Brands get full commercial rights to use the content for ads, landing pages, and organic social media. Creators retain portfolio rights.' },
  { question: 'How does escrow work?', answer: 'Funds are secured upfront when a brand approves a campaign. They are released to the creator instantly once the brand validates the final deliverable.' },
]

export const FAQSection = () => {
  return (
    <Box as="section" py={{ base: 16, md: 24 }} bg="white" position="relative">
      <Container maxW="container.xl" position="relative" zIndex={1}>
        {/* FAQ Header */}
        <VStack spacing={3} textAlign="center" mb={10}>
          <Heading as="h3" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="#111827">
            Frequently Asked Questions
          </Heading>
        </VStack>

        <Box 
          maxW="3xl" 
          mx="auto" 
          bg="white" 
          rounded="8px" 
          border="1px solid #E5E7EB"
          overflow="hidden"
          sx={{
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <Accordion allowToggle>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} border="none" borderBottom={index < faqs.length - 1 ? "1px solid" : "none"} borderColor="#E5E7EB">
                <h3>
                  <AccordionButton py={5} px={6} _hover={{ bg: '#F8FAFC' }}>
                    <Box flex="1" textAlign="left" fontWeight="600" fontSize="15px" color="#111827">{faq.question}</Box>
                    <AccordionIcon color="#64748B" />
                  </AccordionButton>
                </h3>
                <AccordionPanel pb={5} px={6} color="#4B5563" fontSize="14px" lineHeight="1.7">{faq.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </Container>
    </Box>
  )
}

