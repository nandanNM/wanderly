import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hosts we render trip media / avatars from, so next/image can optimize
    // and lazy-load them. Covers S3 (private presigned URLs), the Picsum demo
    // placeholders, and DiceBear avatars.
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
