import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-pages/**",
      ".tmp/**",
      ".local/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
      "node_modules/**",
      "out/**",
      "tmp/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "@next/next/google-font-display": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      "@next/next/no-typos": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
