import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75, 90],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    optimizePackageImports: ["@/components", "framer-motion", "lucide-react"],
  },
  // Disable dev overlay in development
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
