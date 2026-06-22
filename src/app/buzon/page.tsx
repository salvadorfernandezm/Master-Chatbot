export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import HubClient from "./HubClient";

export default async function BuzonHubPage() {
  const settings = await prisma.settings.findFirst();
  
  // Si el buzón está apagado, mostramos pantalla de mantenimiento
  if (settings && !settings.isBuzonActive) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] border-b-8 border-amber-500 shadow-2xl">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-3xl font-black uppercase mb-4 text-amber-500">En Mantenimiento</h1>
          <p className="text-slate-400 italic mb-8">
            El sistema de Voz Ética se encuentra temporalmente fuera de servicio por actualización de procesos. Por favor, vuelve más tarde.
          </p>
          <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full opacity-50"></div>
        </div>
      </div>
    );
  }

  const latestResolved = await prisma.ticket.findMany({
    where: { status: "RESUELTO" },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });

  return (
    <HubClient settings={settings} latestResolved={latestResolved} />
  );
}