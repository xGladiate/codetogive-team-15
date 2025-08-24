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


  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",   
    },
  },
};
module.exports = nextConfig;
