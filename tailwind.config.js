/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FFF9ED', // Light cream background requested
          200: '#FFF3D6', // Light saffron card background requested
          300: '#FDE7B0',
          400: '#FCD882',
        },
        saffron: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706', // Primary saffron
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        maroon: {
          800: '#7C2D12',
          900: '#5B3513', // Dark brown/maroon text requested
          950: '#3D1C06',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          teal: '#075E54',
          light: '#DCF8C6',
        },
      },
      fontFamily: {
        serif: ['var(--font-cinzel)', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'divine': '0 10px 30px -5px rgba(217, 119, 6, 0.12), 0 4px 6px -2px rgba(91, 53, 19, 0.05)',
        'divine-lg': '0 20px 40px -10px rgba(217, 119, 6, 0.2), 0 8px 16px -4px rgba(91, 53, 19, 0.08)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(217, 119, 6, 0.06)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        float: 'float 4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
