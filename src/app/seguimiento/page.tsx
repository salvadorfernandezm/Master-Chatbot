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
      if (res.ok) {
        setTicket(data);
      } else {
        setError(data.error || "Folio no encontrado");
        setTicket(null);
      }
    } catch (e) {
      setError("Error al conectar con el sistema");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white font-sans">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-black uppercase tracking-widest text-center mb-8 text-emerald-500">
          Seguimiento de Reporte
        </h1>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/10 mb-8">
          <p className="text-sm text-slate-400 mb-6 text-center italic">
            Introduce tu folio secreto para conocer el estatus de tu caso.
          </p>
          
          <div className="flex gap-4">
            <input 
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej: ETH-A1B2"
              className="flex-1 bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-xl font-black tracking-tighter"
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !folio}
              className="bg-emerald-600 hover:bg-emerald-500 px-8 rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-4 ml-2 font-bold uppercase">{error}</p>}
        </div>

        {ticket && (
          <div className="bg-slate-900 rounded-[2.5rem] border-b-8 border-emerald-500 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estatus Actual</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${ticket.status === 'RESUELTO' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {ticket.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tu reporte:</p>
                <p className="text-slate-200 italic font-serif">"{ticket.content}"</p>
              </div>

              <div className="bg-black/30 p-6 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Respuesta de la Autoridad:</p>
                <p className="text-md text-white font-medium">
                    {ticket.authorityResponse || "La autoridad está revisando tu caso. Por favor, vuelve pronto."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}