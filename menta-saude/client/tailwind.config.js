/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        principal: '#008F84',
        'principal-escuro': '#007A70',
        'principal-claro': '#e6f8f7',
        primario: '#00A99D',
        'primario-hover': '#008F84',
      }
    },
  },
  plugins: [],
}
