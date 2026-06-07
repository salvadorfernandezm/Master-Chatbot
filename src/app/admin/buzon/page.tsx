export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { updateTicketStatus } from "@/app/actions/admin";

export default async function AdminBuzonPage() {
  let tickets: any[] = [];
  
  try {
    tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("Error al leer Supabase:", e);
    tickets = [];
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-b-8 border-emerald-500">
        <div className="z-10">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Panel General de Gestión</h1>
          <p className="text-slate-400 text-sm italic mt-2 underline decoration-emerald-500 decoration-2 underline-offset-4">
             "Administración total de voces y fallos técnicos."
          </p>
        </div>
        <div className="z-10 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center">
            <p className="text-2xl font-black text-emerald-400">{tickets.length}</p>
            <p className="text-[10px] uppercase font-bold tracking-tighter text-slate-300">Registros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif">No hay actividad en el buzón todavía.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[3rem] shadow-xl border-2 border-slate-50 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <div className="p-10">
                
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                         ticket.type === 'SOPORTE_TECNICO' ? 'bg-amber-100 text-amber-700' : 
                         ticket.type === 'GRAVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'
                      }`}>
                         {ticket.type}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         Folio: {ticket.folio} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800">
                      De: <span className="text-purple-600 font-medium">{ticket.studentName || "Anónimo"}</span>
                      {ticket.studentEmail && <span className="text-xs text-slate-400 font-normal ml-2">({ticket.studentEmail})</span>}
                    </h3>

                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 italic text-slate-600 leading-relaxed text-md relative group-hover:bg-white transition-colors duration-300">
                      <span className="absolute -top-4 -left-2 text-6xl text-slate-200 pointer-events-none opacity-50">“</span>
                      {ticket.content}
                    </div>
                  </div>

                  <div className="w-full md:w-48 text-right">
                    <div className={`text-sm font-black p-3 rounded-2xl text-center shadow-lg uppercase tracking-wider ${
                      ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN DE RESPUESTA DE LA AUTORIDAD */}
                {ticket.authorityResponse && (
                  <div className="mt-6 p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 relative">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Respuesta Registrada:</p>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${ticket.studentResolved ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-700'}`}>
                            {ticket.studentResolved ? "✅ Alumno Satisfecho" : "⏳ Esperando Validación"}
                        </span>
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed">"{ticket.authorityResponse}"</p>
                    
                   {/* BOTÓN DE EVIDENCIA PARA ADMINISTRADORES */}
{t.authorityEvidence && (
  <div className="mt-4">
    <a 
      href={t.authorityEvidence} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-400/30"
    >
      <span>📎</span> Ver Evidencia Adjunta
    </a>
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