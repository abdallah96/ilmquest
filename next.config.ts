import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

export default nextConfig;
