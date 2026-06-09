"use client";

import { useState, useEffect } from "react";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buzon/directora') // Reutilizamos la misma API que la dire para traer todo
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans">
      <header className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Gestión General</h1>
        <div className="bg-white/10 px-6 py-2 rounded-3xl text-2xl font-black text-emerald-400">{tickets.length}</div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? <p className="text-center italic">Cargando...</p> : 
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-[3rem] shadow-xl p-10 border border-slate-100">
              <div className="flex justify-between items-start text-left">
                <div className="flex-1">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase mr-2">{ticket.type}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">FOLIO: {ticket.folio}</span>
                  <p className="text-slate-700 italic font-serif text-lg mt-4">"{ticket.content}"</p>

{/* ARCHIVOS ADJUNTOS EN TU PANEL */}
{ticket.attachments && ticket.attachments.length > 0 && (
  <div className="mt-4 flex flex-wrap gap-2">
    {ticket.attachments.map((file: any) => (
      <a 
        key={file.id} 
        href={file.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-all"
      >
        📎 {file.name} ({file.type === 'STUDENT' ? 'Alumno' : 'Autoridad'})
      </a>
    ))}
  </div>
)}
                  
                  {ticket.authorityResponse && (
                    <div className="mt-6 p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase">Respuesta Oficial:</p>
                      <p className="text-sm text-slate-700 italic">"{ticket.authorityResponse}"</p>
                      {ticket.authorityEvidence && (
                        <div className="mt-4"><a href={ticket.authorityEvidence} target="_blank" className="text-[10px] bg-blue-100 text-blue-700 p-2 rounded-lg font-bold uppercase">📎 Ver Evidencia</a></div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${ticket.status === 'RESUELTO' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{ticket.status}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}