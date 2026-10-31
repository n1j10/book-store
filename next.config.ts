import type { NextConfig } from "next";

// Baseline security headers applied to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
