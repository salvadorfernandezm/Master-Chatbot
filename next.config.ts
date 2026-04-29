import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. Librerías externas */
  serverExternalPackages: ['@prisma/client', 'langchain', 'pdf-parse', 'mammoth', 'xlsx'],
  
  /* 2. Aumento de límite de carga */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Subimos a 50MB por si las imágenes pesan mucho
    },
  },
};

export default nextConfig;