"use client";
import { useState, useEffect } from "react";
import { updateTicketStatus } from "@/lib/actions";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);

  useEffect(() => {
    fetchData();
  }, [viewArchived]);

  const fetchData = () => {
    setLoading(true);
    const url = viewArchived ? '/api/buzon/admin?view=archived' : '/api/buzon/admin';
    fetch(url)
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const msg = newStatus === "ARCHIVADO" ? "¿Archivar este reporte?" : "¿Restaurar este reporte?";
    if (confirm(msg)) {
      await updateTicketStatus(id, newStatus);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left">
      <header className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl flex justify-between items-center border-b-8 border-emerald-500">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest">{viewArchived ? "Sótano de Archivos" : "Panel General"}</h1>
          <p className="text-slate-400 text-xs italic mt-2 uppercase">{viewArchived ? "Histórico de reportes archivados" : "Gestión y Control Ético"}</p>
        </div>
        <button 
          onClick={() => setViewArchived(!viewArchived)}
          className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] transition-all ${viewArchived ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
        >
          {viewArchived ? "← Volver al Panel" : "📁 Ver Archivo"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {loading ? <p className="text-center italic text-slate-500 py-20 animate-pulse uppercase">Cargando...</p> : 
          tickets.map((ticket: any) => (
            <div key={ticket.id} className={`bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden ${viewArchived ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              <div className="p-12">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">{ticket.type}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Folio: {ticket.folio}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Reportante: {ticket.studentName || "Anónimo"}</h3>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 italic text-slate-700 shadow-inner">"{ticket.content}"</div>
                  </div>

                  <div className="w-full lg:w-56 space-y-4">
                    <div className={`text-xs font-black p-4 rounded-2xl text-center uppercase tracking-widest ${ticket.status === 'ARCHIVADO' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'}`}>{ticket.status}</div>
                    
                    {/* BOTÓN DINÁMICO: ARCHIVAR O RESTAURAR */}
                    <button 
                      onClick={() => handleStatusChange(ticket.id, viewArchived ? "PENDIENTE" : "ARCHIVADO")}
                      className="w-full text-[10px] font-black py-3 rounded-2xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50 transition-all uppercase"
                    >
                      {viewArchived ? "🔓 Restaurar Caso" : "📁 Archivar"}
                    </button>
                    
                    <div className="text-[9px] text-slate-400 uppercase font-bold text-center">Recibido: {new Date(ticket.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}