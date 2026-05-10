export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";

export default async function AdminBuzon() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Gestión del Buzón</h1>
        <p className="text-slate-500">Escuchando las voces que buscan vez.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.length === 0 ? (
          <div className="p-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            Aún no hay reportes en el buzón. La paz reina en la facultad.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className={`bg-white p-6 rounded-3xl shadow-sm border-l-8 transition-all hover:shadow-md ${
              ticket.type === 'GRAVE' ? 'border-red-500' : 
              ticket.type === 'ACADEMICA' ? 'border-amber-400' : 'border-blue-400'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tipo: {ticket.type} • {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                  <h3 className="font-bold text-slate-700 mt-1 italic">
                    Remitente: {ticket.studentName || "Anónimo"}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                  {ticket.status}
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {ticket.content}
              </p>
              <div className="mt-4 flex gap-2">
                {/* En el futuro aquí pondremos botones para la IA */}
                <button className="text-[10px] font-bold text-purple-600 uppercase tracking-widest hover:underline">
                  Ver análisis de IA →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}