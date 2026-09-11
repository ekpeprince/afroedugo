/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#065F46", // Forest Emerald
          dark: "#044E39",
          light: "#0D7A5C",
          subtle: "#E6F4F0",
        },
        secondary: {
          DEFAULT: "#0D7A5C",
          dark: "#044E39",
          light: "#065F46",
        },
        sand: "#F4EFE6",
        linen: "#FAF8F5",
        surface: {
          DEFAULT: "#FFFFFF",
          card: "#FFFFFF",
          dark: "#0D1613",
          cardDark: "#14211D",
        }
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #065F46 0%, #0D7A5C 100%)",
        'warm-subtle': "radial-gradient(circle at 50% 0%, rgba(6, 95, 70, 0.04) 0%, transparent 70%)",
      }
    },
  },
  plugins: [],
}
