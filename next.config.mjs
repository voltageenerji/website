/** @type {import('next').NextConfig} */
// For GitHub Pages project sites the app is served under /<repo>, so an
// optional base path is injected via env at build time. Production
// (Cloudflare, custom domain root) leaves it empty.
const basePath = process.env.PAGES_BASE_PATH || "";
// Optional absolute CDN prefix (e.g. jsDelivr) for public previews where the
// HTML is opened from one origin but assets are served from a CDN.
const assetPrefix = process.env.ASSET_PREFIX || basePath || undefined;

const nextConfig = {
  // Static export so the site continues to deploy on Cloudflare Pages
  // as plain static assets (build output dir: `out`).
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Cloudflare Pages serves /path/ — trailingSlash keeps deep links clean.
  trailingSlash: false,
  basePath: basePath || undefined,
  assetPrefix,
};

export default nextConfig;
