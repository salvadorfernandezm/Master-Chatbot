export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DirectorPanelPage() {
  // Solo traemos los reportes que NO sean fallos técnicos
  const tickets = await prisma.ticket.findMany({
    where: {
      NOT: { type: 'SOPORTE_TECNICO' }
    },
    orderBy: { createdAt: 'desc' }
  });

  const total = tickets.length;
  const pendientes = tickets.filter(t => t.status === 'PENDIENTE').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header Minimalista para la Directora */}
      <header className="bg-slate-900 text-white p-8 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Panel de Alta Gestión</h1>
            <p className="text-slate-400 text-xs mt-1 italic">"Transparencia y Calidad Institucional"</p>
          </div>
          <div className="text-right">
             <p className="text-3xl font-black">{total}</p>
             <p className="text-[10px] uppercase tracking-tighter opacity-50">Reportes Totales</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        {/* Resumen de impacto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-2">Pendientes de Solución</p>
              <p className="text-4xl font-black text-amber-500">{pendientes}</p>
           </div>
           <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg text-white">
              <p className="text-emerald-100 text-xs font-bold uppercase mb-2">Casos Resueltos</p>
              <p className="text-4xl font-black">{total - pendientes}</p>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
              <Link href="/buzon" className="text-blue-600 font-bold hover:underline text-sm">Ir al Portal Público ↗</Link>
           </div>
        </div>

        {/* Listado de Voces */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-tight ml-2">Voces Ciudadanas (Sin Soporte Técnico)</h2>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-2 h-full ${ticket.type === 'GRAVE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black">{ticket.type}</span>
                    <span className="text-[10px] text-slate-400">Folio: {ticket.folio}</span>
                  </div>
                  <p className="text-slate-700 italic font-serif text-lg leading-relaxed">"{ticket.content}"</p>
                </div>
                <div className="md:w-48 text-right">
                  <span className={`block p-3 rounded-2xl text-xs font-black uppercase text-center ${ticket.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}