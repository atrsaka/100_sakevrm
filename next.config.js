const isStaticExport = process.env.NEXT_EXPORT === "true";
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: basePath,
  basePath,
  trailingSlash: true,
  distDir: isStaticExport ? ".next-pages" : ".next",
  output: isStaticExport ? "export" : undefined,
  images: {
    unoptimized: isStaticExport,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
