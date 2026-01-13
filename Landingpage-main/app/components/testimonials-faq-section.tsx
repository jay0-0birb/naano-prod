'use client'

import { Box, Container, Heading, Text, Flex, SimpleGrid, VStack, Avatar, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const MotionBox = motion(Box)

const testimonials = [
  { avatar: 'https://i.pravatar.cc/150?img=12', name: 'Marcus Chen', role: 'Founder @ TechStart', quote: 'We replaced our entire FB Ads budget with Naano creators. CAC dropped by 40% in month one.' },
  { avatar: 'https://i.pravatar.cc/150?img=33', name: 'Sarah Lopez', role: 'DevRel Engineer', quote: 'Finally, a platform that understands developer marketing. The briefs are clear and payments are instant.' },
  { avatar: 'https://i.pravatar.cc/150?img=68', name: 'James Park', role: 'Head of Growth @ SaasCo', quote: 'The workflow is insane. From match to published content in 3 days. Highly recommend.' },
  { avatar: 'https://i.pravatar.cc/150?img=27', name: 'Emily Richards', role: 'Tech YouTuber', quote: "Best creator platform I've used. No invoice chasing, no vague briefs. Just professional collabs with serious brands." },
  { avatar: 'https://i.pravatar.cc/150?img=59', name: 'David Kumar', role: 'VP Marketing @ CloudFlow', quote: 'Authentic content that actually converts. Our demo signups tripled after working with Naano creators.' },
  { avatar: 'https://i.pravatar.cc/150?img=41', name: 'Alex Torres', role: 'Indie Developer & Creator', quote: 'Love how they pre-vet brands. No more wasting time on sketchy deals. The escrow system is a game-changer.' },
  { avatar: 'https://i.pravatar.cc/150?img=8', name: 'Rachel Kim', role: 'CMO @ DevTools Inc', quote: 'We tried agencies, we tried influencer marketplaces. Naano is the only one that gets B2B SaaS marketing right.' },
  { avatar: 'https://i.pravatar.cc/150?img=52', name: 'Michael Chen', role: 'Content Creator & Consultant', quote: "Finally earning what I'm worth. The brands on Naano actually respect creators and pay fair rates." },
  { avatar: 'https://i.pravatar.cc/150?img=19', name: 'Lisa Anderson', role: 'CEO @ StartupHub', quote: 'ROI is crystal clear. We can track every click, every signup. This is how modern SaaS marketing should work.' },
]

const faqs = [
  { question: 'How do you vet the creators?', answer: 'Every creator is manually verified. We review their GitHub contributions, LinkedIn profile, audience engagement metrics, and content quality. Only the top 1% make it through.' },
  { question: 'Is it really free for creators?', answer: 'Yes, absolutely. We charge a service fee to the brands, not the talent. You keep 100% of your negotiated rate.' },
  { question: 'Who owns the content rights?', answer: 'Brands get full commercial rights to use the content for ads, landing pages, and organic social media. Creators retain portfolio rights.' },
  { question: 'How does escrow work?', answer: 'Funds are secured upfront when a brand approves a campaign. They are released to the creator instantly once the brand validates the final deliverable.' },
]

export const TestimonialsAndFAQ = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <Box as="section" py={{ base: 16, md: 24 }} bg="bg.main" position="relative" ref={ref}>
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
      <Container maxW="container.xl" position="relative" zIndex={1}>
        {/* Testimonials */}
        <VStack spacing={3} textAlign="center" mb={12}>
          <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" color="brand.primary">
            Don't take our word for it.
          </Heading>
        </VStack>

        {/* Auto-scrolling testimonials */}
        <Box position="relative" h="600px" overflow="hidden" mb={20}>
          <style jsx global>{`
            @keyframes scrollUp {
              0% { transform: translateY(0); }
              100% { transform: translateY(-50%); }
            }
          `}</style>

          {/* Fade gradients */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="80px"
            bgGradient="linear(to-b, bg.main, transparent)"
            zIndex="2"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            h="80px"
            bgGradient="linear(to-t, bg.main, transparent)"
            zIndex="2"
            pointerEvents="none"
          />

          <Flex gap={5} h="full">
            {/* Column 1 */}
            <VStack
              flex="1"
              spacing={5}
              animation="scrollUp 30s linear infinite"
              _hover={{ animationPlayState: 'paused' }}
            >
              {[...testimonials.slice(0, 3), ...testimonials.slice(0, 3)].map((testimonial, index) => (
                <Box
                  key={index}
                  bg="#FFFFFF"
                  border="1px solid #E5E7EB"
                  rounded="8px"
                  p={6}
                  minH="160px"
                  w="full"
                  sx={{
                    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
                  }}
                  _hover={{ 
                    borderColor: '#CBD5E1',
                  }}
                  transition="border-color 0.2s ease"
                >
                  <Flex align="center" mb={4}>
                    <Avatar src={testimonial.avatar} name={testimonial.name} size="md" mr={3} />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="brand.primary">{testimonial.name}</Text>
                      <Text fontSize="xs" color="text.muted">{testimonial.role}</Text>
                    </Box>
                  </Flex>
                  <Text fontSize="sm" color="text.main" lineHeight="1.6">"{testimonial.quote}"</Text>
                </Box>
              ))}
            </VStack>

            {/* Column 2 */}
            <VStack
              flex="1"
              spacing={5}
              animation="scrollUp 35s linear infinite"
              _hover={{ animationPlayState: 'paused' }}
              display={{ base: 'none', md: 'flex' }}
            >
              {[...testimonials.slice(3, 6), ...testimonials.slice(3, 6)].map((testimonial, index) => (
                <Box
                  key={index}
                  bg="#FFFFFF"
                  border="1px solid #E5E7EB"
                  rounded="8px"
                  p={6}
                  minH="160px"
                  w="full"
                  sx={{
                    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
                  }}
                  _hover={{ 
                    borderColor: '#CBD5E1',
                  }}
                  transition="border-color 0.2s ease"
                >
                  <Flex align="center" mb={4}>
                    <Avatar src={testimonial.avatar} name={testimonial.name} size="md" mr={3} />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="brand.primary">{testimonial.name}</Text>
                      <Text fontSize="xs" color="text.muted">{testimonial.role}</Text>
                    </Box>
                  </Flex>
                  <Text fontSize="sm" color="text.main" lineHeight="1.6">"{testimonial.quote}"</Text>
                </Box>
              ))}
            </VStack>

            {/* Column 3 */}
            <VStack
              flex="1"
              spacing={5}
              animation="scrollUp 40s linear infinite"
              _hover={{ animationPlayState: 'paused' }}
              display={{ base: 'none', lg: 'flex' }}
            >
              {[...testimonials.slice(6, 9), ...testimonials.slice(6, 9)].map((testimonial, index) => (
                <Box
                  key={index}
                  bg="#FFFFFF"
                  border="1px solid #E5E7EB"
                  rounded="8px"
                  p={6}
                  minH="160px"
                  w="full"
                  sx={{
                    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
                  }}
                  _hover={{ 
                    borderColor: '#CBD5E1',
                  }}
                  transition="border-color 0.2s ease"
                >
                  <Flex align="center" mb={4}>
                    <Avatar src={testimonial.avatar} name={testimonial.name} size="md" mr={3} />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="brand.primary">{testimonial.name}</Text>
                      <Text fontSize="xs" color="text.muted">{testimonial.role}</Text>
                    </Box>
                  </Flex>
                  <Text fontSize="sm" color="text.main" lineHeight="1.6">"{testimonial.quote}"</Text>
                </Box>
              ))}
            </VStack>
          </Flex>
        </Box>

        {/* FAQ */}
        <VStack spacing={3} textAlign="center" mb={10} mt={20}>
          <Heading as="h3" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="brand.primary">
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
                    <Box flex="1" textAlign="left" fontWeight="500" fontSize="15px" color="#0F172A">{faq.question}</Box>
                    <AccordionIcon color="#64748B" />
                  </AccordionButton>
                </h3>
                <AccordionPanel pb={5} px={6} color="#64748B" fontSize="14px" lineHeight="1.7">{faq.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </Container>
    </Box>
  )
}
