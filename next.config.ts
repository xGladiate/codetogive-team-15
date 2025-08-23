/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cakeofcewflckuwvttgu.supabase.co",
        pathname: "/storage/**", 
      },
    ],
  },
};
module.exports = nextConfig;
