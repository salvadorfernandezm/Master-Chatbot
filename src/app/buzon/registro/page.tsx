export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import BuzonClient from "./BuzonClient"; // Ahora está en la misma carpeta

export default async function RegistroBuzonPage() {
  // Buscamos el reglamento real en la nube (organizationBuzonInfo)
  const settings = await prisma.settings.findFirst();
  
  const reglamentoReal = settings?.organizationBuzonInfo || "El reglamento está siendo actualizado.";

  return (
    <BuzonClient reglamento={reglamentoReal} />
  );
}