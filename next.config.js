const isStaticExport = process.env.NEXT_EXPORT === "true";
const basePath = process.env.BASE_PATH || "";
const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL || `${basePath || ""}/docs/`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: basePath,
  basePath,
  trailingSlash: true,
  output: isStaticExport ? "export" : undefined,
  images: {
    unoptimized: isStaticExport,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_DOCS_URL: docsUrl,
  },
};

module.exports = nextConfig;
