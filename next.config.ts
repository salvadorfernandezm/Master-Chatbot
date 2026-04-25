import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. Permitimos librerías externas rebeldes */
  serverExternalPackages: ['@prisma/client', 'langchain', 'pdf-parse', 'mammoth', 'xlsx'],
  
  /* 2. Aumentamos el límite de tamaño para archivos (Server Actions) */
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Ahora puedes subir archivos de hasta 20 MB
    },
  },
};

export default nextConfig;