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

 const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return null;
    if (['mp4', 'mov', 'webm'].includes(ext || '')) return "🎥 Video";
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return "🎵 Audio";
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    if (['doc', 'docx'].includes(ext || '')) return "📝 Word"; // <--- Añadido Word
    if (['xls', 'xlsx'].includes(ext || '')) return "📊 Excel"; // <--- Añadido Excel
    return "📁 Archivo";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left">
      <header className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Panel General</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase">Gestión de evidencias multiformato</p>
        </div>
        <div className="bg-emerald-500 text-black h-14 w-14 rounded-full flex items-center justify-center text-2xl font-black">{tickets.length}</div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {loading ? (
          <p className="text-center italic text-slate-500 py-20 animate-pulse text-lg tracking-widest uppercase">Cargando...</p>
        ) : (
          tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-12">
                <div className="flex flex-col lg:flex-row justify-between gap-10 text-slate-800">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${ticket.type === 'SOPORTE_TECNICO' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>{ticket.type}</span>
                      {ticket.category && <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700">{ticket.category}</span>}
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Folio: {ticket.folio}</span>
                    </div>

                    <h3 className="text-2xl font-black">
                      Reportante: <span className="text-emerald-600 underline decoration-slate-200 underline-offset-8">{ticket.studentName || "Anónimo"}</span>
                      {ticket.studentEmail && <span className="block text-xs font-bold text-slate-400 mt-1">{ticket.studentEmail}</span>}
                    </h3>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 italic text-slate-700 shadow-inner">"{ticket.content}"</div>

                    {/* EVIDENCIAS MULTIFORMATO */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="pt-6">
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-4 tracking-[0.3em]">📸 Evidencias Digitales</p>
                        <div className="flex flex-wrap gap-4">
                          {ticket.attachments.map((att: any) => {
                            const icon = getFileIcon(att.url);
                            return (
                              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" 
                                 className="group relative h-32 w-32 rounded-3xl overflow-hidden border-4 border-slate-50 hover:border-emerald-500 transition-all shadow-md bg-slate-100 flex flex-col items-center justify-center text-center p-2">
                                {icon ? (
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">{icon}</span>
                                ) : (
                                  <img src={att.url} alt="Evidencia" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[10px] text-white font-black">VER</span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-full lg:w-56 space-y-4">
                    <div className={`text-xs font-black p-4 rounded-2xl text-center uppercase tracking-widest shadow-lg ${ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>{ticket.status}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold text-center">Recibido: {new Date(ticket.createdAt).toLocaleDateString()}</div>
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