'use client'

import { Box, Container, Heading, Text, Flex, Avatar, Badge, Icon, HStack, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Instagram, Linkedin, Twitter, CheckCircle2, TrendingUp, Users } from 'lucide-react'

// Mock Data for Creator Cards
const creators = [
  {
    name: "Sarah Chen",
    handle: "@sarah.tech",
    role: "SaaS Growth",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    platforms: [
      { icon: Linkedin, followers: "12k" },
      { icon: Twitter, followers: "8k" }
    ],
    engagement: "4.8%",
    price: "$250",
    tags: ["B2B", "Tech", "AI"]
  },
  {
    name: "Alex Rivera",
    handle: "@alex_builds",
    role: "Indie Hacker",
    avatar: "https://i.pravatar.cc/150?u=alex",
    platforms: [
      { icon: Twitter, followers: "25k" },
      { icon: Instagram, followers: "5k" }
    ],
    engagement: "6.2%",
    price: "$400",
    tags: ["DevTools", "SaaS", "Coding"]
  },
  {
    name: "Emma Wilson",
    handle: "@emma_marketing",
    role: "Marketing Tips",
    avatar: "https://i.pravatar.cc/150?u=emma",
    platforms: [
      { icon: Linkedin, followers: "45k" }
    ],
    engagement: "3.5%",
    price: "$600",
    tags: ["Marketing", "Growth", "B2B"]
  },
  {
    name: "David Park",
    handle: "@design_david",
    role: "Product Design",
    avatar: "https://i.pravatar.cc/150?u=david",
    platforms: [
      { icon: Instagram, followers: "18k" },
      { icon: Twitter, followers: "12k" }
    ],
    engagement: "5.1%",
    price: "$350",
    tags: ["Design", "UX/UI", "Tools"]
  },
  {
    name: "Lisa Thompson",
    handle: "@lisa_fintech",
    role: "Fintech Expert",
    avatar: "https://i.pravatar.cc/150?u=lisa",
    platforms: [
      { icon: Linkedin, followers: "28k" }
    ],
    engagement: "4.2%",
    price: "$500",
    tags: ["Fintech", "Finance", "B2B"]
  },
  {
    name: "James Miller",
    handle: "@james_nocode",
    role: "No-Code Pro",
    avatar: "https://i.pravatar.cc/150?u=james",
    platforms: [
      { icon: Twitter, followers: "15k" },
      { icon: Linkedin, followers: "5k" }
    ],
    engagement: "7.5%",
    price: "$300",
    tags: ["NoCode", "Automation", "SaaS"]
  }
]

const CreatorCard = ({ creator }: { creator: typeof creators[0] }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    rounded="xl"
    p={5}
    w="300px"
    flexShrink={0}
    position="relative"
    transition="all 0.2s"
    _hover={{
      borderColor: "blue.400",
      transform: "translateY(-4px)",
      boxShadow: "0 12px 24px -8px rgba(59, 130, 246, 0.15)"
    }}
  >
    {/* Verified Badge Absolute */}
    <Box position="absolute" top={5} right={5}>
      <Icon as={CheckCircle2} w={5} h={5} color="#3B82F6" fill="#EFF6FF" />
    </Box>

    {/* Header */}
    <Flex gap={3} mb={4}>
      <Avatar src={creator.avatar} size="md" border="2px solid white" boxShadow="sm" />
      <Box>
        <Text fontSize="15px" fontWeight="600" color="gray.900" lineHeight="1.2">
          {creator.name}
        </Text>
        <Text fontSize="12px" color="gray.500" fontWeight="500">
          {creator.handle}
        </Text>
      </Box>
    </Flex>

    {/* Tags */}
    <Flex gap={2} mb={4} flexWrap="wrap">
      {creator.tags.map((tag) => (
        <Badge
          key={tag}
          px={2}
          py={0.5}
          bg="gray.50"
          color="gray.600"
          fontSize="10px"
          fontWeight="500"
          rounded="md"
          border="1px solid"
          borderColor="gray.100"
          textTransform="none"
        >
          {tag}
        </Badge>
      ))}
    </Flex>

    {/* Platforms Grid */}
    <Box bg="gray.50" rounded="lg" p={3} border="1px solid" borderColor="gray.100">
      <Flex justify="space-between" align="center">
        <HStack spacing={2}>
          <Icon as={Users} w={3.5} h={3.5} color="gray.400" />
          <Text fontSize="11px" color="gray.500" fontWeight="500">Audience</Text>
        </HStack>
        <Text fontSize="13px" fontWeight="600" color="gray.900">
          {(parseInt(creator.platforms[0].followers) + (creator.platforms[1] ? parseInt(creator.platforms[1].followers) : 0)) + 'k+'}
        </Text>
      </Flex>
    </Box>

    {/* Platforms Footer */}
    <Flex mt={4} pt={3} borderTop="1px solid" borderColor="gray.100" justify="space-between" align="center">
      <Flex gap={3}>
        {creator.platforms.map((platform, i) => (
          <HStack key={i} spacing={1}>
            <Icon as={platform.icon} w={3.5} h={3.5} color="gray.400" />
            <Text fontSize="11px" color="gray.500" fontWeight="500">{platform.followers}</Text>
          </HStack>
        ))}
      </Flex>
    </Flex>
  </Box>
)

export const CreatorShowcaseSection = () => {
  return (
    <Box as="section" id="creators" py={{ base: 20, md: 24 }} bg="white" overflow="hidden">
      <Container maxW="container.xl" mb={12} textAlign="center">
        <Badge
          bg="blue.50"
          color="blue.600"
          px={3}
          py={1}
          rounded="full"
          fontSize="12px"
          fontWeight="600"
          mb={4}
          border="1px solid"
          borderColor="blue.100"
        >
          DISCOVER CREATORS
        </Badge>
        <Heading
          as="h2"
          fontSize={{ base: '32px', md: '44px' }}
          fontWeight="700"
          color="gray.900"
          letterSpacing="-0.03em"
          lineHeight="1.1"
          mb={4}
        >
          Find your perfect match
        </Heading>
        <Text fontSize="18px" color="gray.500" maxW="600px" mx="auto">
          Browse through hundreds of vetted B2B creators ready to showcase your product.
        </Text>
      </Container>

      {/* Marquee Container - Row 1 */}
      <Box position="relative" w="full" mb={8}>
        {/* Gradient Masks */}
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          w="150px"
          bgGradient="linear(to-r, white, transparent)"
          zIndex="2"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          right="0"
          top="0"
          bottom="0"
          w="150px"
          bgGradient="linear(to-l, white, transparent)"
          zIndex="2"
          pointerEvents="none"
        />

        <motion.div
          animate={{ x: [0, -1800] }} // Adjust based on total width
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: "linear"
          }}
          style={{ display: 'flex', gap: '24px', paddingLeft: '24px', width: 'max-content' }}
        >
          {/* Double the list for seamless loop */}
          {[...creators, ...creators, ...creators].map((creator, i) => (
            <CreatorCard key={i} creator={creator} />
          ))}
        </motion.div>
      </Box>

      {/* Marquee Container - Row 2 (Reverse) */}
      <Box position="relative" w="full">
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          w="150px"
          bgGradient="linear(to-r, white, transparent)"
          zIndex="2"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          right="0"
          top="0"
          bottom="0"
          w="150px"
          bgGradient="linear(to-l, white, transparent)"
          zIndex="2"
          pointerEvents="none"
        />
        
        <motion.div
          animate={{ x: [-1800, 0] }} // Reverse direction
          transition={{
            repeat: Infinity,
            duration: 45, // Slightly slower
            ease: "linear"
          }}
          style={{ display: 'flex', gap: '24px', paddingLeft: '24px', width: 'max-content' }}
        >
          {[...[...creators].reverse(), ...[...creators].reverse(), ...[...creators].reverse()].map((creator, i) => (
            <CreatorCard key={i} creator={creator} />
          ))}
        </motion.div>
      </Box>
    </Box>
  )
}
