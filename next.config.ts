import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["supabase.co"],
  },
  // PWA configuration (à activer avec next-pwa si besoin)
  // PWA activable pour installation sur mobile/PC
};

export default nextConfig;

