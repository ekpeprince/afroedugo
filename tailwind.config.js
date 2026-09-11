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
          DEFAULT: "#133E33", // Deep Eucalyptus Pine (Academic, Earthy, Trust)
          dark: "#0B2720",
          light: "#1C5446",
          subtle: "#EBF3F0",
        },
        terracotta: {
          DEFAULT: "#D96B43", // Warm Terracotta Clay (Warmth, Energy, Heritage)
          dark: "#BF5630",
          light: "#E88562",
          subtle: "#FBF0EB",
        },
        secondary: {
          DEFAULT: "#D96B43", // Map secondary to Terracotta for seamless consistency
          dark: "#BF5630",
          light: "#E88562",
        },
        sand: "#F4EFE6",
        linen: "#FAF8F5", // Clean porcelain linen surface
        surface: {
          DEFAULT: "#FFFFFF",
          card: "#FFFFFF",
          dark: "#0D1613",
          cardDark: "#14211D",
        }
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #133E33 0%, #1C5446 100%)",
        'terracotta-gradient': "linear-gradient(135deg, #D96B43 0%, #BF5630 100%)",
        'warm-subtle': "radial-gradient(circle at 50% 0%, rgba(19, 62, 51, 0.04) 0%, transparent 70%)",
      }
    },
  },
  plugins: [],
}
