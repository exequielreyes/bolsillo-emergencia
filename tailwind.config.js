/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { senal: "#FFD400", alerta: "#E5001C", ok: "#00B140" },
    },
  },
  plugins: [],
};
