'use client'

import { Box, Flex, Button, Text, HStack, Link } from '@chakra-ui/react'
import { useScroll, useTransform, motion } from 'framer-motion'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

export const Navbar = () => {
  const { scrollY } = useScroll()
  
  // Progressive transformations based on scroll (0 to 300px) - slower animation
  const maxWidth = useTransform(scrollY, [0, 300], ['900px', '580px'])
  const height = useTransform(scrollY, [0, 300], ['44px', '40px'])
  const paddingX = useTransform(scrollY, [0, 300], ['24px', '16px'])
  const paddingTop = useTransform(scrollY, [0, 300], ['16px', '10px'])
  const borderRadius = useTransform(scrollY, [0, 300], ['12px', '100px'])
  const fontSize = useTransform(scrollY, [0, 300], ['13px', '12px'])
  const logoSize = useTransform(scrollY, [0, 300], ['15px', '14px'])
  const buttonHeight = useTransform(scrollY, [0, 300], ['32px', '28px'])
  const buttonPadding = useTransform(scrollY, [0, 300], ['14px', '12px'])
  const opacity = useTransform(scrollY, [0, 200], [0.75, 0.95])
  const shadow = useTransform(
    scrollY, 
    [0, 300], 
    ['0 2px 8px -2px rgba(15, 23, 42, 0.06)', '0 4px 20px -4px rgba(15, 23, 42, 0.15)']
  )

  return (
    <MotionBox
      as="nav"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="1000"
      px={{ base: 4, md: 6 }}
      style={{ paddingTop }}
    >
      <MotionFlex
        mx="auto"
        align="center"
        justify="space-between"
        style={{
          maxWidth,
          height,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          borderRadius,
          boxShadow: shadow,
        }}
        sx={{
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Background with animated opacity */}
        <MotionBox
          position="absolute"
          inset={0}
          bg="white"
          style={{ 
            opacity,
            borderRadius,
          }}
          zIndex={-1}
        />

        {/* Logo */}
        <motion.div style={{ fontSize: logoSize }}>
          <Text 
            fontWeight="700" 
            color="#0F172A"
            letterSpacing="-0.02em"
          >
            Naano
          </Text>
        </motion.div>

        {/* Center Links */}
        <HStack 
          spacing={0} 
          display={{ base: 'none', md: 'flex' }}
          position="absolute"
          left="50%"
          transform="translateX(-50%)"
        >
          {[
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '#' },
            { label: 'About', href: '/about' }
          ].map((item) => (
            <motion.div key={item.label} style={{ fontSize }}>
              <Link 
                href={item.href}
                fontWeight="500"
                color="#64748B"
                px={3}
                py={1}
                rounded="full"
                _hover={{ 
                  color: '#0F172A', 
                  textDecoration: 'none' 
                }}
                transition="color 0.15s ease"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </HStack>

        {/* Right CTA */}
        <HStack spacing={2}>
          <motion.div style={{ fontSize }}>
            <Link
              href="#"
              fontWeight="500"
              color="#64748B"
              px={2}
              _hover={{ 
                color: '#0F172A',
                textDecoration: 'none',
              }}
              transition="color 0.15s ease"
              display={{ base: 'none', sm: 'flex' }}
            >
              Sign in
            </Link>
          </motion.div>
          <motion.div style={{ height: buttonHeight }}>
            <Button
              h="full"
              px={3}
              fontSize="12px"
              fontWeight="600"
              bg="#0F172A"
              color="white"
              rounded="full"
              _hover={{ 
                bg: '#1E293B',
              }}
              transition="background 0.15s ease"
            >
              Get started
            </Button>
          </motion.div>
        </HStack>
      </MotionFlex>
    </MotionBox>
  )
}
