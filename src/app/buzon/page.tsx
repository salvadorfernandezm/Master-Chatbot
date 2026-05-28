export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma"; // <--- ESTA ES LA LÍNEA QUE FALTABA
import BuzonClient from "./BuzonClient";

export default async function PublicBuzonPage() {
  // 1. Consultamos los ajustes en Supabase
  const settings = await prisma.settings.findFirst();
  
  // 2. CONTROL DE APAGADO (Botón de pánico)
  if (settings && settings.isBuzonActive === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md p-10 rounded-[3rem] border border-white/10 bg-slate-900 shadow-2xl animate-in fade-in duration-700">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-xl font-black uppercase tracking-widest mb-4 text-emerald-500">Buzón en Mantenimiento</h1>
          <p className="text-slate-400 text-sm italic leading-relaxed">
            "Estamos ajustando el sistema para servirte mejor. Por favor, vuelve más tarde."
          </p>
          <div className="mt-8 pt-8 border-t border-white/5">
             <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Atentamente:</p>
             <p className="text-xs text-slate-500 font-bold">{settings.organizationName}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. SI ESTÁ ACTIVO, CARGAMOS EL REGLAMENTO DINÁMICO
  const reglamentoReal = settings?.organizationBuzonInfo || "El reglamento está siendo actualizado.";

  return (
    <BuzonClient reglamento={reglamentoReal} />
  );
}