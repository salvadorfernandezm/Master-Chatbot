import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configuración corregida para Next.js 16 */
  serverExternalPackages: ['@prisma/client', 'langchain', 'pdf-parse', 'mammoth', 'xlsx'],
};

export default nextConfig;