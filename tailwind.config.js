/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#606c38",
        secondary: "#283618",
        background: "#fefae0",
        accent: "#dda15e",
        highlight: "#bc6c25",
      },
    },
  },
  plugins: [],
}
