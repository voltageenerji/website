/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site continues to deploy on Cloudflare Pages
  // as plain static assets (build output dir: `out`).
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Cloudflare Pages serves /path/ — trailingSlash keeps deep links clean.
  trailingSlash: false,
};

export default nextConfig;
