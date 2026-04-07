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

const socialLinks = [
  { icon: "github", link: "https://github.com/Sunwood-ai-labs/GeminiVRM" },
];

const rootNav = [
  { text: "Home", link: "/" },
  { text: "Getting Started", link: "/getting-started" },
  { text: "Usage", link: "/usage" },
  { text: "Podcast Benchmark", link: "/podcast-benchmark" },
  { text: "Release Notes", link: "/releases" },
  { text: "YouTube Relay", link: "/youtube-relay" },
  { text: "Architecture", link: "/architecture" },
  { text: "Troubleshooting", link: "/troubleshooting" },
];

const rootSidebar = [
  {
    text: "Start Here",
    items: [
      { text: "Documentation Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Usage Guide", link: "/usage" },
      { text: "Podcast Benchmark Report", link: "/podcast-benchmark" },
      { text: "Release Notes", link: "/releases" },
      { text: "YouTube Relay Guide", link: "/youtube-relay" },
      { text: "Deployment Guide", link: "/deployment" },
    ],
  },
  {
    text: "Deep Dives",
    items: [
      { text: "Architecture", link: "/architecture" },
      { text: "Podcast Benchmark", link: "/podcast-benchmark" },
      { text: "Troubleshooting", link: "/troubleshooting" },
      { text: "Repository QA Inventory", link: "/repository-qa-inventory" },
    ],
  },
];

const jaNav = [
  { text: "ホーム", link: "/ja/" },
  { text: "開始手順", link: "/ja/getting-started" },
  { text: "使い方", link: "/ja/usage" },
  { text: "リリースノート", link: "/ja/releases" },
  { text: "YouTube リレー", link: "/ja/youtube-relay" },
  { text: "アーキテクチャ", link: "/ja/architecture" },
  { text: "トラブルシュート", link: "/ja/troubleshooting" },
];

const jaSidebar = [
  {
    text: "はじめに",
    items: [
      { text: "ドキュメントホーム", link: "/ja/" },
      { text: "開始手順", link: "/ja/getting-started" },
      { text: "使い方", link: "/ja/usage" },
      { text: "リリースノート", link: "/ja/releases" },
      { text: "YouTube リレーガイド", link: "/ja/youtube-relay" },
      { text: "デプロイ", link: "/ja/deployment" },
    ],
  },
  {
    text: "詳細",
    items: [
      { text: "アーキテクチャ", link: "/ja/architecture" },
      { text: "トラブルシュート", link: "/ja/troubleshooting" },
      { text: "Repository QA Inventory", link: "/ja/repository-qa-inventory" },
    ],
  },
];

export default defineConfig({
  title: "GeminiVRM",
  description: "Browser-first VRM chat powered by Gemini Live native audio.",
  lang: "en-US",
  base: docsBase,
  themeConfig: {
    socialLinks,
  },
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "GeminiVRM",
      description: "Browser-first VRM chat powered by Gemini Live native audio.",
      themeConfig: {
        nav: rootNav,
        sidebar: rootSidebar,
      },
    },
    ja: {
      label: "日本語",
      lang: "ja-JP",
      title: "GeminiVRM",
      description: "Gemini Live ネイティブ音声で動く、ブラウザ完結の VRM チャットアプリ。",
      themeConfig: {
        nav: jaNav,
        sidebar: jaSidebar,
      },
    },
  },
});
