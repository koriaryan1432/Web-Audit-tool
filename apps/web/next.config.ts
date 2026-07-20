import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sitegarde/ui", "@sitegarde/types"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
