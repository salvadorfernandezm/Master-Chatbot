"use client";
import { useState } from "react";

export default function SeguimientoPage() {
  const [folio, setFolio] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/buzon/seguimiento?folio=${folio.trim()}`);
      const data = await res.json();
      if (res.ok) setTicket(data);
      else setError(data.error);
    } catch (e) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-black uppercase text-center mb-8 tracking-widest text-emerald-500">Consulta de Seguimiento</h1>
        
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-6">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-4 ml-2">Introduce tu Folio Secreto</label>
          <div className="flex gap-2">
            <input 
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej: ETH-XXXX"
              className="flex-1 bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-xl font-black uppercase"
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !folio}
              className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? "..." : "🔎"}
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px] mt-4 font-bold uppercase ml-2">{error}</p>}
        </div>

        {ticket && (
          <div className="bg-slate-900 rounded-[2.5rem] border-b-8 border-emerald-500 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase text-slate-500">Estado</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${ticket.status === 'RESUELTO' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-white'}`}>
                    {ticket.status}
                </span>
              </div>
              <p className="text-slate-400 text-xs italic">" {ticket.content} "</p>
              <div className="bg-black/40 p-6 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">Respuesta Oficial:</p>
                <p className="text-sm text-slate-200">{ticket.authorityResponse || "Su reporte está en proceso de revisión por el área correspondiente."}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}