export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { createTicket } from "@/app/actions/admin";
import BuzonClient from "./BuzonClient"; // Asegúrate de tener este componente o lo creamos

export default async function PublicBuzonPage() {
  // Buscamos el reglamento real en la nube
  const settings = await prisma.settings.findFirst();
  
  // Si no hay nada escrito, usamos un mensaje de espera
  const reglamentoReal = settings?.organizationBuzonInfo || "El reglamento está siendo actualizado por las autoridades.";

  // Pasamos el reglamento que viene de la base de datos al componente visual
  return (
    <BuzonClient reglamento={reglamentoReal} />
  );
}