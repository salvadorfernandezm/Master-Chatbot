export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import ExcelenciaClient from "./ExcelenciaClient";

export default async function ExcelenciaPage() {
  const settings = await prisma.settings.findFirst();

  // SI EL BUZÓN ESTÁ APAGADO, ESTA SECCIÓN TAMBIÉN (Punto 5)
  if (settings && !settings.isBuzonActive) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] border-b-8 border-amber-500 shadow-2xl">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-3xl font-black uppercase mb-4 text-amber-500">Mantenimiento</h1>
          <p className="text-slate-400 italic mb-8">La Iniciativa de Excelencia está en actualización de procesos. Vuelve pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <ExcelenciaClient settings={settings} />
  );
}