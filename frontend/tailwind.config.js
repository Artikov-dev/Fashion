/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#185FA5',
        success: '#1D9E75',
        warning: '#BA7517',
        danger:  '#E24B4A',
      },
    },
  },
  plugins: [],
}
