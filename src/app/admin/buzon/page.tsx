export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { updateTicketStatus } from "@/app/actions/admin";

export default async function AdminBuzonPage() {
  let tickets: any[] = [];
  
  // Intentamos traer los datos, si falla (por base vacía) no rompemos la página
  try {
    tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("Error al leer Supabase:", e);
    tickets = [];
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-b-8 border-emerald-500">
        <div className="z-10">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Centro de Gestión Ética</h1>
          <p className="text-slate-400 text-sm italic mt-2 underline decoration-emerald-500 decoration-2 underline-offset-4">
             "Donde los que no tenían vez, hoy son escuchados."
          </p>
        </div>
        <div className="z-10 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center">
            <p className="text-2xl font-black text-emerald-400">{tickets.length}</p>
            <p className="text-[10px] uppercase font-bold tracking-tighter text-slate-300">Reportes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif">La tranquilidad reina en el campus. No hay reportes registrados.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[3rem] shadow-xl border-2 border-slate-50 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <div className="p-10 flex flex-col md:flex-row gap-10">
                
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                       ticket.type === 'GRAVE' ? 'bg-red-500 text-white animate-pulse' : 
                       ticket.type === 'ACADEMICA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                       {ticket.type}
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                       Folio: {ticket.folio} • {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-800">
                    Remitente: <span className="text-purple-600 font-medium">{ticket.studentName || "Anónimo"}</span>
                  </h3>

                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 italic text-slate-600 leading-relaxed text-lg relative group-hover:bg-white transition-colors duration-300 shadow-inner">
                    <span className="absolute -top-4 -left-2 text-6xl text-slate-200 pointer-events-none opacity-50">“</span>
                    {ticket.content}
                  </div>
                </div>

                <div className="w-full md:w-56 space-y-6 border-l-2 border-slate-50 pl-0 md:pl-10">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estatus</p>
                    <div className={`text-sm font-black p-3 rounded-2xl text-center shadow-lg uppercase tracking-wider ${
                      ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}