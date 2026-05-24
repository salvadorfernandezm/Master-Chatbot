export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";

export default async function AdminBuzonPage() {
  // 1. Buscamos todos los reportes enviados por los alumnos
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* CABECERA DEL MONITOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-6xl opacity-10">📩</div>
        <div className="z-10">
          <h1 className="text-2xl font-black uppercase tracking-widest">Gestión del Buzón</h1>
          <p className="text-slate-400 text-sm italic">Monitor de Voz y Vez del Alumnado</p>
        </div>
        <div className="bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-500/30">
          {tickets.length} Reportes en total
        </div>
      </div>

      {/* LISTADO DE REPORTES */}
      <div className="grid grid-cols-1 gap-6">
        {tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <p className="text-slate-400 italic">No hay mensajes en el buzón. Todo está en orden.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all border-l-[12px] ${
              ticket.type === 'GRAVE' ? 'border-l-red-500' : 'border-l-slate-900'
            }`}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                         ticket.type === 'GRAVE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                       }`}>
                         {ticket.type}
                       </span>
                       <span className="text-[10px] text-slate-400 font-bold">
                         {new Date(ticket.createdAt).toLocaleString('es-MX')}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                      De: <span className="font-medium text-slate-600 uppercase">{ticket.studentName || "Anónimo"}</span>
                    </h3>
                  </div>
                  
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                     <span className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                       {ticket.status}
                     </span>
                  </div>
                </div>

                {/* CONTENIDO DEL MENSAJE */}
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 mb-6 italic text-slate-700 leading-relaxed shadow-inner">
                  "{ticket.content}"
                </div>

                {/* VISOR DE EVIDENCIAS */}
                {ticket.evidenceUrl && (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 border-dashed">
                    <span className="text-2xl">📁</span>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Evidencia Adjunta</p>
                      <p className="text-xs text-emerald-600 font-medium truncate">{ticket.evidenceUrl}</p>
                    </div>
                    <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase">Ver</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}