/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7542C8',
          hover: '#6334B0',
          light: '#F7F5FC',
          dark: '#582CA1',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        bg: {
          light: '#F7F5FC',
          dark: '#171321',
        },
        card: {
          light: '#FFFFFF',
          dark: '#211B30',
          darker: '#1B1627',
        }
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
