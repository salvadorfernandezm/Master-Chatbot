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

  if (loading) {
    return <div className="p-20 text-center text-slate-500 italic">Cargando la base de datos...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left text-slate-900">
      {/* TÍTULO MODIFICADO PARA PRUEBA DE SINCRONIZACIÓN */}
      <header className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Panel de Control Ético</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase tracking-tighter">Sincronización verificada v1.1</p>
        </div>
        <div className="bg-white/10 px-6 py-2 rounded-3xl text-2xl font-black text-emerald-400">
          {tickets.length}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {tickets.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
             <p className="text-slate-300 text-xl italic font-serif">No hay actividad en el buzón.</p>
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
                      <span className="text-xs font-bold text-slate-400 uppercase">
                         Folio: {ticket.folio}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800">
                      De: <span className="text-purple-600 font-medium">{ticket.studentName || "Anónimo"}</span>
                    </h3>

                    {/* MENSAJE DEL ALUMNO - SIN CLASES COMPLICADAS */}
                    <div className="bg-slate-50 p-6 rounded-2xl border italic text-slate-600">
                      <p>{ticket.content}</p>
                    </div>

                    {/* EVIDENCIAS */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t">
                        {ticket.attachments.map((file: any) => (
                          <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                            📎 {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-48 text-right self-start">
                    <div className={`text-sm font-black p-3 rounded-2xl text-center uppercase ${ticket.status === 'PENDIENTE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
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