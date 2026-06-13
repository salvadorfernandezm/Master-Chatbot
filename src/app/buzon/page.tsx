export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import HubClient from "./HubClient";

export default async function BuzonHubPage() {
  // 1. Traemos los ajustes del servidor
  const settings = await prisma.settings.findFirst();
  
  // 2. Traemos los últimos 3 reportes resueltos
  const latestResolved = await prisma.ticket.findMany({
    where: { status: "RESUELTO" },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });

  // 3. Se los enviamos al "HubClient" que es el que tiene la palomita
  return (
    <HubClient settings={settings} latestResolved={latestResolved} />
  );
}