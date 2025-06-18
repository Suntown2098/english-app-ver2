import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Fredoka'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        kidblue: '#6EC1E4',
        kidpink: '#FF8DC7',
        kidyellow: '#FFE066',
        kidgreen: '#3A5A40',
        kidpurple: '#B39DDB',
        olive: {
          DEFAULT: '#8BA870',
          light: '#A3B18A',
          dark: '#6B8E23',
        },
        cream: '#DAD7CD',
        sage: {
          DEFAULT: '#808000',
          light: '#A3B18A',
          dark: '#6B8E23',
        },
      },
    },
  },
  plugins: [],
};
export default config;
