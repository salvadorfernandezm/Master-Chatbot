"use client";

import { useState } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR" | "SENDING">("IDLE");
  const [folio, setFolio] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(formData: FormData) {
    setStatus("SENDING");
    try {
      const result = await createTicket(formData);
      if (result && result.folio) {
        setFolio(result.folio);
        setStatus("SUCCESS");
      } else {
        setStatus("ERROR");
      }
    } catch (e) {
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500 animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-6 text-emerald-500">✓</div>
          <h1 className="text-2xl font-black uppercase mb-4 tracking-tighter">Reporte Registrado</h1>
          <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8 shadow-inner">
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black text-white tracking-tighter">{folio}</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-8">
            IMPORTANTE: Guarda este folio. Es la única forma de consultar la respuesta de la autoridad manteniendo tu anonimato.
          </p>
          <button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl font-bold transition-all">
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-50">Sistema de Voz Ética</h1>
          <div className="h-1 w-20 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
        </header>

        {/* REGLAMENTO DINÁMICO (Viene de Supabase) */}
        <section className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 mb-8 shadow-2xl">
          <h2 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span>📜</span> Reglamento y Marco Ético
          </h2>
          <div className="prose prose-invert prose-sm max-h-[500px] overflow-y-auto pr-4 mb-6 custom-scrollbar text-slate-300 italic font-serif">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer group bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/50 transition-all">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-6 h-6 rounded-lg border-2 border-emerald-500 bg-transparent checked:bg-emerald-500 transition-all cursor-pointer"
            />
            <span className="text-sm font-bold text-slate-200">He leído el reglamento y manifiesto mi conformidad.</span>
          </label>
        </section>

        {/* FORMULARIO */}
        <form action={handleSubmit} className={`space-y-6 transition-all duration-700 ${accepted ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 ml-2">Tipo de situación</label>
              <select name="type" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm">
                <option value="ACADEMICA">Asunto Académico</option>
                <option value="LOGISTICA">Instalaciones / Logística</option>
                <option value="GRAVE">Situación Grave / Ética</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="studentEmail" type="email" placeholder="Tu Correo (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-sm" />
              <input name="studentName" type="text" placeholder="Tu Nombre (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-sm" />
            </div>

            <textarea name="content" required rows={5} placeholder="Describe los hechos con detalle..." className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none resize-none text-sm"></textarea>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Evidencia (Clip 📎)</label>
              <input name="evidence" type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-black hover:file:bg-white transition-all cursor-pointer" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === "SENDING"}
            className="w-full bg-emerald-500 hover:bg-white text-black font-black py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
          >
            {status === "SENDING" ? "Registrando Voz..." : "Enviar y Generar Folio"}
          </button>
        </form>
      </div>
    </div>
  );
}