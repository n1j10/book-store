import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      // Neon Storage S3 endpoint host is provisioned per Neon project/branch.
      ...(process.env.AWS_ENDPOINT_URL_S3
        ? [{ protocol: "https" as const, hostname: new URL(process.env.AWS_ENDPOINT_URL_S3).hostname }]
        : []),
    ],
  },
};

export default nextConfig;
