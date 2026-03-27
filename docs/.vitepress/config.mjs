import { defineConfig } from "vitepress";

const normalizeBasePath = (value) => {
  const trimmed = (value || "/").trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const noDoubleSlash = withLeadingSlash.replace(/\/+/g, "/");
  return noDoubleSlash.endsWith("/") ? noDoubleSlash : `${noDoubleSlash}/`;
};

const repoBasePath = normalizeBasePath(process.env.BASE_PATH);
const docsBase = repoBasePath === "/" ? "/" : `${repoBasePath}docs/`;

export default defineConfig({
  title: "GeminiVRM",
  description: "Browser-first VRM chat powered by Gemini Live native audio.",
  lang: "en-US",
  base: docsBase,
  srcExclude: ["**/*.ja.md"],
  themeConfig: {
    nav: [
      { text: "Docs Home", link: "/" },
      { text: "Get Started", link: "/deployment" },
      { text: "Architecture", link: "/architecture" },
    ],
    sidebar: [
      {
        text: "Start Here",
        items: [
          { text: "Documentation Home", link: "/" },
          { text: "Deployment Guide", link: "/deployment" },
          { text: "Architecture Guide", link: "/architecture" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Repository QA Inventory", link: "/repository-qa-inventory" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/Sunwood-ai-labs/GeminiVRM" },
    ],
  },
});
