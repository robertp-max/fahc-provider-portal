import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1B4F72',
          darkBlue: '#133B57',
          softBlue: '#C7DCEB',
          paleBlue: '#EDF5F8',
          gold: '#FAD06E',
          darkGold: '#C29A2A',
          softGold: '#FDE9B8',
          cream: '#FBF5EB',
          black: '#1F1F1F',
          charcoal: '#3A3A3A',
          lightGray: '#F2F2F2',
          white: '#FAFAFA',
        },
      },
      fontFamily: {
        // Loaded via next/font in the root layout (CSS variables).
        heading: ['var(--font-lora)', 'Lora', 'serif'], // Use sparingly for premium warmth
        body: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'], // Use for dense portal data
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(27, 79, 114, 0.05)',
        card: '0 1px 3px rgba(27, 79, 114, 0.06), 0 4px 20px -8px rgba(27, 79, 114, 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
