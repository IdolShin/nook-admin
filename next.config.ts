import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Content-Type', value: 'application/javascript; charset=utf-8' }],
      },
    ];
  },
};

export default nextConfig;

