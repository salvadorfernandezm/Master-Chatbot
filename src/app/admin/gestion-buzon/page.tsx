"use client";
import { useState, useEffect } from "react";
import { updateTicketStatus, downloadFullHistory } from "@/lib/actions";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    const msg = newStatus === "ARCHIVADO" ? "¿Archivar reporte?" : "¿Restaurar reporte?";
    if (confirm(msg)) {
      await updateTicketStatus(id, newStatus);
      fetchData();
    }
  };

  // LÓGICA DE DESCARGA (PUNTO 9)
  const handleExport = async () => {
    setIsExporting(true);
    const res = await downloadFullHistory();
    if (res.success) {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Historico_Buzon_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Error al generar el historial.");
    }
    setIsExporting(false);
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    return "🖼️ Imagen";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans text-left">
      <header className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center border-b-8 border-emerald-500 gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase">{viewArchived ? "Sótano Histórico" : "Gestión de Voz"}</h1>
          <p className="text-slate-400 text-xs italic mt-1 uppercase tracking-widest">Control de transparencia institucional</p>
        </div>
        <div className="flex gap-3">
            {/* BOTÓN DE EXPORTAR (PUNTO 9) */}
            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] transition-all shadow-lg flex items-center gap-2"
            >
                {isExporting ? "Generando..." : "📥 Bajar Historial"}
            </button>
            <button 
                onClick={() => setViewArchived(!viewArchived)}
                className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] transition-all ${viewArchived ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'}`}
            >
                {viewArchived ? "← Volver" : "📁 Ver Archivo"}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-400">CARGANDO...</p> : 
          tickets.map((ticket: any) => (
            <div key={ticket.id} className={`bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden ${viewArchived ? 'opacity-60 grayscale-[0.3]' : ''}`}>
              <div className="p-12">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{ticket.type}</span>
                      {ticket.category && <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{ticket.category}</span>}
                      <span className="text-[10px] font-bold text-slate-300">Folio: {ticket.folio}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Reportante: <span className="text-emerald-600">{ticket.studentName || "Anónimo"}</span></h3>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 italic text-slate-700 shadow-inner leading-relaxed">"{ticket.content}"</div>
                    
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-4 pt-4">
                        {ticket.attachments.map((att: any) => (
                           <a key={att.id} href={att.url} target="_blank" className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 flex items-center justify-center bg-slate-50 text-[10px] font-black text-slate-400 text-center uppercase p-1">
                             {att.url.endsWith('.pdf') ? "📄 PDF" : <img src={att.url} className="h-full w-full object-cover" />}
                           </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-56 space-y-4">
                    <div className={`text-xs font-black p-4 rounded-2xl text-center uppercase tracking-widest ${
                        ticket.status === 'APELADO' ? 'bg-red-600 text-white animate-bounce' : 
                        ticket.status === 'NO ATENDIDO EN TIEMPO' ? 'bg-black text-red-500 border-2 border-red-500 animate-pulse' : 
                        'bg-emerald-600 text-white'
                    }`}>{ticket.status}</div>
                    <button onClick={() => handleStatusChange(ticket.id, viewArchived ? "PENDIENTE" : "ARCHIVADO")} className="w-full text-[10px] font-black py-3 rounded-2xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50 transition-all uppercase">
                        {viewArchived ? "🔓 Restaurar" : "📁 Archivar"}
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