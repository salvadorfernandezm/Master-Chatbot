"use client";

import { useState } from "react";
import Link from "next/link";
import { ... } from "@/lib/actions";

export default function SeguimientoPage() {
  const [folio, setFolio] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voted, setVoted] = useState(false);
  
  // Estados para la apelación
  const [showAppealBox, setShowAppealBox] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [sendingAppeal, setSendingAppeal] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setVoted(false);
    setShowAppealBox(false);
    setAppealReason("");
    try {
      const res = await fetch(`/api/seguimiento?folio=${folio.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Folio no encontrado");
      setTicket(data);
    } catch (e: any) {
      setError(e.message || "Error de conexión");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSatisfied() {
    if (!ticket) return;
    const res = await setStudentSatisfaction(ticket.id, true);
    if (res.success) {
      setVoted(true);
      setTicket({ ...ticket, studentResolved: true, status: "RESUELTO" });
    }
  }

  async function handleSendAppeal() {
    if (!appealReason.trim()) return alert("Por favor, explica tus motivos.");
    setSendingAppeal(true);
    const res = await submitAppeal(ticket.id, appealReason);
    if (res.success) {
      setVoted(true);
      setShowAppealBox(false);
      setTicket({ ...ticket, status: "APELADO" });
    }
    setSendingAppeal(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-left">
      <div className="max-w-md w-full">
        
        <Link href="/buzon" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-6 group">
           <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Volver al Portal
        </Link>

        <h1 className="text-2xl font-black uppercase text-center mb-8 tracking-widest text-emerald-500">Seguimiento Ético</h1>
        
        {/* BUSCADOR */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-6">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-4 ml-2">Folio Secreto</label>
          <div className="flex gap-2">
            <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej: ETH-XXXX" className="flex-1 bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-xl font-black uppercase text-white" />
            <button onClick={handleSearch} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded-2xl font-bold">
              {loading ? "..." : "🔎"}
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px] mt-4 font-bold uppercase ml-2">{error}</p>}
        </div>

        {/* RESULTADO DEL TICKET */}
        {ticket && (
          <div className="bg-slate-900 rounded-[2.5rem] border-b-8 border-emerald-500 overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase text-slate-500">Estatus Actual</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                  ticket.status === 'RESUELTO' ? 'bg-emerald-500 text-black' : 
                  ticket.status === 'APELADO' ? 'bg-red-600 text-white animate-pulse' : 
                  'bg-amber-500 text-white'
                }`}>
                    {ticket.status}
                </span>
              </div>

              {ticket.status === 'RESUELTO' && !ticket.studentResolved && !voted && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl text-center">
                  <p className="text-amber-500 text-[11px] font-black uppercase">⚠️ Tienes 72 horas para validar esta respuesta.</p>
                </div>
              )}
              
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">Tu reporte:</p>
                <p className="text-slate-300 italic text-sm">"{ticket.content}"</p>
              </div>

              <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-tighter">Respuesta recibida:</p>
                <p className="text-sm text-white leading-relaxed">{ticket.authorityResponse || "En proceso..."}</p>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-8 pt-6 border-t border-white/5">
                {ticket.status === 'APELADO' ? (
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 font-bold text-xs uppercase text-center">
                    Tu inconformidad ha sido enviada a Dirección.
                  </div>
                ) : ticket.studentResolved || voted ? (
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase text-center">
                    ✓ Caso finalizado.
                  </div>
                ) : ticket.status === 'RESUELTO' ? (
                  <div className="space-y-4">
                    {!showAppealBox ? (
                      <div className="flex gap-4">
                        <button onClick={handleSatisfied} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">SÍ, CONFORME</button>
                        <button onClick={() => setShowAppealBox(true)} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">NO, INCONFORME</button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2">Explica por qué no estás de acuerdo:</label>
                        <textarea 
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          className="w-full bg-black border-2 border-red-900/30 p-4 rounded-2xl text-sm text-white outline-none focus:border-red-600 resize-none"
                          rows={4}
                          placeholder="Escribe tus motivos aquí..."
                        />
                        <div className="flex gap-2">
                          <button onClick={handleSendAppeal} disabled={sendingAppeal} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px]">
                            {sendingAppeal ? "Enviando..." : "Enviar Apelación"}
                          </button>
                          <button onClick={() => setShowAppealBox(false)} className="px-6 bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}