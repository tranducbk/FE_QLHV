/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        custom: {
          DEFAULT: "#012970",
        },
        dark: {
          bg: "#1a1a1a",
          surface: "#2d2d2d",
          border: "#404040",
          text: "#e5e5e5",
          "text-secondary": "#a3a3a3",
        },
        light: {
          bg: "#ffffff",
          surface: "#f8f9fa",
          border: "#e5e7eb",
          text: "#1f2937",
          "text-secondary": "#6b7280",
        },
      },
      width: {
        "calc-240px": "calc(100% - 256px)",
      },
      height: {
        120: "30rem",
      },
    },
    fontSize: {
      s: "0.6rem",
      sm: "0.8rem",
      base: "1rem",
      xl: "1.25rem",
      "2xl": "1.563rem",
      "3xl": "1.953rem",
      "4xl": "2.441rem",
      "5xl": "3.052rem",
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
