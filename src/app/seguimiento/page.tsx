"use client";

import { useState } from "react";
import Link from "next/link";
import { setStudentSatisfaction } from "@/app/actions/admin";

export default function SeguimientoPage() {
  const [folio, setFolio] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voted, setVoted] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setVoted(false);
    try {
      const res = await fetch(`/api/seguimiento?folio=${folio.trim().toUpperCase()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Folio no encontrado");
      }

      setTicket(data);
    } catch (e: any) {
      setError(e.message || "Error al conectar con el servidor");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(satisfied: boolean) {
    if (!ticket) return;
    const res = await setStudentSatisfaction(ticket.id, satisfied);
    if (res.success) {
      setVoted(true);
      setTicket({ ...ticket, studentResolved: satisfied });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        
        <Link href="/buzon" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-6 group">
           <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Volver al Portal
        </Link>

        <h1 className="text-2xl font-black uppercase text-center mb-8 tracking-widest text-emerald-500">Seguimiento Ético</h1>
        
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-6">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-4 ml-2">Folio Secreto</label>
          <div className="flex gap-2">
            <input 
              value={folio} 
              onChange={(e) => setFolio(e.target.value)} 
              placeholder="Ej: ETH-XXXX" 
              className="flex-1 bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-xl font-black uppercase" 
            />
            <button onClick={handleSearch} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded-2xl font-bold">
              {loading ? "..." : "🔎"}
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px] mt-4 font-bold uppercase ml-2">{error}</p>}
        </div>

        {ticket && (
          <div className="bg-slate-900 rounded-[2.5rem] border-b-8 border-emerald-500 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase text-slate-500">Estatus</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${ticket.status === 'RESUELTO' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-white'}`}>
                    {ticket.status}
                </span>
              </div>

              {ticket.status === 'RESUELTO' && !ticket.studentResolved && !voted && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl animate-pulse">
                  <p className="text-amber-500 text-[11px] font-black uppercase tracking-widest text-center">
                    ⚠️ ACCIÓN REQUERIDA: Tienes 72 horas para validar esta solución.
                  </p>
                </div>
              )}
              
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase">Tu reporte original:</p>
                <p className="text-slate-300 italic text-sm">"{ticket.content}"</p>
              </div>

              <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">Respuesta Oficial:</p>
                <p className="text-sm text-white leading-relaxed">
                    {ticket.authorityResponse || "Su reporte está en proceso de revisión."}
                </p>

                {ticket.authorityEvidence && (
                  <a 
                    href={ticket.authorityEvidence} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 p-4 bg-white/5 border border-dashed border-emerald-500/30 rounded-2xl flex items-center gap-3 hover:bg-emerald-500/10 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📎</div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ver Evidencia Adjunta</p>
                    </div>
                  </a>
                )}
              </div>

              {ticket.status === 'RESUELTO' && (
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  {voted || ticket.studentResolved ? (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 font-bold text-sm uppercase">
                        ✓ Gracias. Caso cerrado satisfactoriamente.
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">¿Estás conforme?</p>
                      <div className="flex gap-4">
                        <button onClick={() => handleVote(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-lg">SÍ</button>
                        <button onClick={() => handleVote(false)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-lg">NO</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}