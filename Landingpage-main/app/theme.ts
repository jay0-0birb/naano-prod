'use client'

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const colors = {
  brand: {
    primary: '#111827',     // Ink Black - Primary headings
    accent: '#3B82F6',      // Accent bleu clair
    accentLight: '#60A5FA',
    accentDark: '#1D4ED8',
    surface: '#FFFFFF',
    background: '#FFFFFF',  // Pure white background
    muted: '#4B5563',       // Body text color
    border: '#E5E7EB',      // Card borders
    // Legacy (pour compatibilité)
    navy: '#111827',
    blue: '#3B82F6',
    blueDark: '#1D4ED8',
    offWhite: '#FFFFFF',
  },
  // Semantic mapping
  primary: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',  // Ink Black
  },
  accent: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  text: {
    main: '#111827',        // Ink Black for headings
    body: '#4B5563',        // Dark grey for body text
    muted: '#6B7280',
    light: '#9CA3AF',
  },
  bg: {
    main: '#FFFFFF',        // Pure white
    white: '#FFFFFF',
    subtle: '#F9FAFB',
  }
}

const styles = {
  global: {
    'html, body': {
      bg: 'bg.main',
      color: 'text.body',
      fontFamily: 'var(--font-jakarta)',
    },
    'h1, h2, h3, h4, h5, h6': {
      color: 'text.main',
    },
  },
}

const fonts = {
  heading: 'var(--font-jakarta)',
  body: 'var(--font-jakarta)',
}

const components = {
  Heading: {
    baseStyle: {
      letterSpacing: '-0.03em', // Tight tracking for headings
    },
  },
  Text: {
    baseStyle: {
      letterSpacing: '-0.01em', // Slightly tight for body text
    },
  },
  Button: {
    baseStyle: {
      letterSpacing: '-0.01em',
    }
  }
}

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

export const theme = extendTheme({
  config,
  colors,
  styles,
  fonts,
  components, // Added components configuration
})
