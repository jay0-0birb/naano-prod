'use client'

import { Box, Container, Flex, Icon, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

const MotionBox = motion(Box)

export const DemoSection = () => {
  return (
    <Box as="section" py={{ base: 12, md: 20 }} bg="white">
      <Container maxW="container.xl">
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          maxW="1000px"
          mx="auto"
        >
          {/* Browser Frame */}
          <Box
            rounded="2xl"
            border="1px solid"
            borderColor="gray.200"
            bg="white"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.15)"
            overflow="hidden"
          >
            {/* Browser Header */}
            <Flex
              h="12"
              align="center"
              px={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              bg="gray.50"
              gap={2}
            >
              <Flex gap={1.5}>
                <Box w={3} h={3} rounded="full" bg="#FF5F57" />
                <Box w={3} h={3} rounded="full" bg="#FEBC2E" />
                <Box w={3} h={3} rounded="full" bg="#28C840" />
              </Flex>
              <Box 
                flex={1} 
                mx={4} 
                h={7} 
                bg="white" 
                rounded="md" 
                border="1px solid" 
                borderColor="gray.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" color="gray.400">naano.com/demo</Text>
              </Box>
            </Flex>

            {/* Video Placeholder Area */}
            <Box
              position="relative"
              paddingTop="56.25%" // 16:9 Aspect Ratio
              bg="gray.900"
              cursor="pointer"
              group="true"
              role="group"
            >
              <Flex
                position="absolute"
                inset={0}
                align="center"
                justify="center"
                bgGradient="linear(to-br, gray.800, gray.900)"
              >
                {/* Play Button */}
                <Flex
                  w={20}
                  h={20}
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="white"
                  color="gray.900"
                  transition="all 0.3s ease"
                  _groupHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                >
                  <Icon as={Play} w={8} h={8} ml={1} fill="currentColor" />
                </Flex>
                
                <Text
                  position="absolute"
                  bottom={8}
                  color="white"
                  fontWeight="500"
                  opacity={0.8}
                >
                  Watch 1-minute demo
                </Text>
              </Flex>
            </Box>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  )
}

