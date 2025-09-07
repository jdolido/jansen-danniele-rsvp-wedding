/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        script: ["'Great Vibes'", "cursive"], // custom script font
      },
    },
  },
  plugins: [],
};
