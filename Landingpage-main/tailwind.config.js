/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#111827',    // Ink Black - Primary headings
          accent: '#3B82F6',     // Accent - Bleu clair
          accentLight: '#60A5FA', // Accent clair
          accentDark: '#1D4ED8', // Accent foncé
          surface: '#FFFFFF',    // Surface principale
          background: '#FFFFFF', // Pure white background
          muted: '#4B5563',      // Body text - Dark grey
          border: '#E5E7EB',     // Card borders
        },
      },
    },
  },
  plugins: [],
}
