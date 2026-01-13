'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export const Navbar = () => {
  const { scrollY } = useScroll()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Progressive transformations based on scroll (0 to 300px)
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

  if (!mounted) return null

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[1000] px-4 md:px-6"
      style={{ paddingTop }}
    >
      <motion.div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth,
          height,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          borderRadius,
          boxShadow: shadow,
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Background with animated opacity */}
        <motion.div
          className="absolute inset-0 bg-white -z-10"
          style={{
            opacity,
            borderRadius,
          }}
        />

        {/* Logo */}
        <motion.div style={{ fontSize: logoSize }}>
          <Link href="/" className="font-bold text-[#0F172A] tracking-tight">
            Naano
          </Link>
        </motion.div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'About', href: '/about' },
          ].map((item) => (
            <motion.div key={item.label} style={{ fontSize }}>
              <Link
                href={item.href}
                className="font-medium text-[#64748B] px-3 py-1 rounded-full hover:text-[#0F172A] transition-colors duration-150"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          <motion.div style={{ fontSize }}>
            <Link
              href="/login"
              className="hidden sm:flex font-medium text-[#64748B] px-2 hover:text-[#0F172A] transition-colors duration-150"
            >
              Sign in
            </Link>
          </motion.div>
          <motion.div style={{ height: buttonHeight }}>
            <Link
              href="/register"
              className="h-full px-3 text-xs font-semibold bg-[#0F172A] text-white rounded-full hover:bg-[#1E293B] transition-all duration-150 flex items-center justify-center"
              style={{ height: buttonHeight, paddingLeft: buttonPadding, paddingRight: buttonPadding }}
            >
              Get started
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  )
}

