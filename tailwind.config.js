/** @type {import('tailwindcss').Config} */
export default {
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
        primary: "#065F46", // Forest Emerald (Academic & Trust)
        secondary: "#F59E0B", // Saffron Gold (Social & Optimism)
        pearl: "#FDFCFB", // Warm Surface
      },
      backgroundImage: {
        'saffron-gradient': "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      }
    },
  },
  plugins: [],
}
