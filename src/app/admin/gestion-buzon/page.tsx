"use client";

import { useState, useEffect } from "react";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buzon/admin') 
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left">
      <header className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Panel de Gestión</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase tracking-tighter">Sincronizado con Supabase Storage</p>
        </div>
        <div className="bg-emerald-500 text-black h-14 w-14 rounded-full flex items-center justify-center text-2xl font-black shadow-lg">
          {tickets.length}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {loading ? (
          <p className="text-center italic text-slate-500 py-20 animate-pulse text-lg tracking-widest uppercase">Cargando reportes...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif tracking-widest">Buzón vacío</p>
          </div>
        ) : (
          tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden hover:-translate-y-1 transition-all duration-300">
              <div className="p-12">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                  
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${ticket.type === 'SOPORTE_TECNICO' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
                         {ticket.type}
                      </span>
                      {ticket.category && (
                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                          {ticket.category}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Folio: {ticket.folio}</span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-800">
                      Reportante: <span className="text-emerald-600 underline decoration-slate-200 underline-offset-8">{ticket.studentName || "Anónimo"}</span>
                    </h3>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 italic text-slate-700 leading-relaxed shadow-inner">
                      "{ticket.content}"
                    </div>

                    {/* SECCIÓN DE EVIDENCIAS - CRÍTICA */}
                    {ticket.attachments && ticket.attachments.length > 0 ? (
                      <div className="pt-6">
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-4 tracking-[0.3em]">📸 Evidencias Digitales ({ticket.attachments.length})</p>
                        <div className="flex flex-wrap gap-4">
                          {ticket.attachments.map((att: any) => (
                            <a 
                              key={att.id} 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="group relative h-32 w-32 rounded-3xl overflow-hidden border-4 border-slate-50 hover:border-emerald-500 transition-all shadow-md"
                            >
                              <img src={att.url} alt="Evidencia" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-black tracking-widest">VER</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">Sin evidencias adjuntas.</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-56 space-y-4">
                    <div className={`text-xs font-black p-4 rounded-2xl text-center uppercase tracking-widest shadow-lg ${ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
                      {ticket.status}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold text-center">
                      Recibido: {new Date(ticket.createdAt).toLocaleDateString()}
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