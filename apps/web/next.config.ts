import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sitegade/ui", "@sitegade/types"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
          : []),
      ],
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
