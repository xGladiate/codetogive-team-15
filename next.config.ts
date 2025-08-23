import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cakeofcewflckuwvttgu.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};
module.exports = nextConfig;
