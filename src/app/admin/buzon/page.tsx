"use client";

import { useState, useEffect } from "react";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buzon/directora') 
      .then(res => res.json())
      .then(data => { 
        setTickets(data); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("Error cargando datos:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left text-slate-900">
      {/* Encabezado Principal */}
      <header className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Gestión General</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase tracking-tighter">Administración de voces y fallos técnicos.</p>
        </div>
        <div className="bg-white/10 px-6 py-2 rounded-3xl text-2xl font-black text-emerald-400">
          {tickets.length}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <p className="text-center italic text-slate-500 py-20 animate-pulse text-lg">Cargando la base de datos...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif text-lg">No hay actividad en el buzón todavía.</p>
          </div>
        ) : (
          tickets.map((ticket: any) => (
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
                      {ticket.studentEmail && (
                        <span className="text-xs text-slate-400 font-normal ml-2 italic">({ticket.studentEmail})</span>
                      )}
                    </h3>

                    {/* Mensaje del alumno */}
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 italic text-slate-600 leading-relaxed text-md relative group-hover:bg-white transition-colors duration-300 shadow-inner">
                      <span className="absolute -top-4 -left-2 text-6xl text-slate-200 pointer-events-none opacity-50 font-serif">“</span>
                      <p className="relative z-10">{ticket.content}</p>
                    </div>

                    {/* GALERÍA DE EVIDENCIAS DEL ALUMNO */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {ticket.attachments.map((file: any) => (
                          <a 
                            key={file.id} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <span>📎</span> {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Estado del Ticket */}
                  <div className="w-full md:w-48 text-right self-start">
                    <div className={`text-sm font-black p-3 rounded-2xl text-center shadow-lg uppercase tracking-wider ${
                      ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>

                {/* RESPUESTA DE LA AUTORIDAD */}
                {ticket.authorityResponse && (
                  <div className="mt-6 p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 relative">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Respuesta Registrada:</p>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${ticket.studentResolved ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-700'}`}>
                            {ticket.studentResolved ? "✅ Alumno Satisfecho" : "⏳ Esperando Validación"}
                        </span>
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed">"{ticket.authorityResponse}"</p>
                    
                    {/* Evidencia de la autoridad */}
                    {ticket.authorityEvidence && (
                      <div className="mt-3 flex items-center gap-2">
                        <a 
                          href={ticket.authorityEvidence} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 font-bold text-[10px] uppercase hover:underline flex items-center gap-1"
                        >
                          <span>📎</span> Ver comprobante oficial
                        </a>
                      </div>
                    )}
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