"use client";

import { useState, useEffect } from "react";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buzon/admin') 
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
      <header className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Gestión General</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase tracking-tighter">Administración de voces y fallos técnicos.</p>
        </div>
        <div className="bg-white/10 px-6 py-2 rounded-3xl text-2xl font-black text-emerald-400">
          {tickets.length}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <p className="text-center italic text-slate-500 py-20 animate-pulse text-lg">Cargando...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif">Sin reportes nuevos.</p>
          </div>
        ) : (
          tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white rounded-[3rem] shadow-xl border-2 border-slate-50 overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="p-10">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                         {ticket.type}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         Folio: {ticket.folio}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800">
                      De: <span className="text-purple-600 font-medium">{ticket.studentName || "Anónimo"}</span>
                    </h3>
                   <div className="bg-slate-50 p-6 rounded-2xl border italic text-slate-600">
  <p>{ticket.content}</p>
</div>

{/* PUNTO B: VISUALIZACIÓN DE EVIDENCIAS */}
{ticket.attachments && ticket.attachments.length > 0 && (
  <div className="mt-6">
    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Evidencias adjuntas:</p>
    <div className="flex flex-wrap gap-4">
      {ticket.attachments.map((att: any) => (
        <a 
          key={att.id} 
          href={att.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative h-24 w-24 rounded-xl overflow-hidden border-2 border-slate-100 hover:border-emerald-500 transition-all"
        >
          <img 
            src={att.url} 
            alt={att.name} 
            className="h-full w-full object-cover group-hover:scale-110 transition-transform" 
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">VER</span>
          </div>
        </a>
      ))}
    </div>
  </div>
)}

