/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        principal: '#0F6E56',
        'principal-escuro': '#0a5240',
        'principal-claro': '#e6f4f0',
        primario: '#1D9E75',
        'primario-hover': '#179065',
      }
    },
  },
  plugins: [],
}
