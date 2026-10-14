
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1769B2",
          50: "#EFF8FF",
          100: "#DCEFFF",
          200: "#B9DEFA",
          300: "#83C5F0",
          400: "#47A5E1",
          500: "#2489CE",
          600: "#1769B2",
          700: "#15558F",
          800: "#174875",
          900: "#193D60",
        },
      },
    },
  },

  plugins: [],
};
