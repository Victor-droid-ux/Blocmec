/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // SECURITY: Do NOT ignore ESLint and TypeScript errors
  // Broken code will silently ship without these checks
  // If you need to temporarily ignore specific files, use .eslintignore
  // and tsconfig paths, never build-time ignores
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
