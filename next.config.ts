import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'langchain', 'pdf-parse', 'mammoth', 'xlsx'],
  },
};

export default nextConfig;