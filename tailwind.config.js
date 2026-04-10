const { light, dark } = require("@charcoal-ui/theme");
const { createTailwindConfig } = require("@charcoal-ui/tailwind-config");
/**
 * @type {import('tailwindcss/tailwind-config').TailwindConfig}
 */
module.exports = {
  darkMode: true,
  content: ["./src/**/*.tsx", "./src/**/*.html"],
  presets: [
    createTailwindConfig({
      version: "v3",
      theme: {
        ":root": light,
      },
    }),
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7A8FD6",
        "primary-hover": "#93A6E0",
        "primary-press": "#AEBDEA",
        "primary-disabled": "#7A8FD64D",
        secondary: "#8E9BE3",
        "secondary-hover": "#A6B1EA",
        "secondary-press": "#BEC7F0",
        "secondary-disabled": "#8E9BE34D",
        base: "#E8EDFA",
        "text-primary": "#3F4A7A",
      },
      fontFamily: {
        M_PLUS_2: ["Montserrat", "M_PLUS_2", "sans-serif"],
        Montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
