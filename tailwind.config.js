/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20301F",
        paper: "#EFEBE1",
        stamp: "#A13D2B",
        verified: "#2F6B3D",
        manifest: "#8C8672",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
