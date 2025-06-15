/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cnp: {
          blue: '#3B82F6',
          red: '#EF4444',
          yellow: '#F59E0B',
          green: '#10B981',
          dark: '#1F2937',
          light: '#F3F4F6'
        }
      },
      animation: {
        'card-hover': 'card-hover 0.3s ease-in-out',
        'card-play': 'card-play 0.5s ease-out',
      },
      keyframes: {
        'card-hover': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-10px)' }
        },
        'card-play': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.2) rotate(5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        }
      }
    },
  },
  plugins: [],
};