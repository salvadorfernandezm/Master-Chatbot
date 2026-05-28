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
    const result = await createTicket(formData);
    if (result && result.folio) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    // ... (el cuadro del éxito con el Folio que ya tienes) ...
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500">Sistema de Voz Ética</h1>
          <p className="text-slate-500 text-xs mt-2 italic">Facultad de Psicología y Terapia de la Comunicación Humana</p>
        </header>

        {/* REGLAMENTO DINÁMICO E IMPOSTANTE */}
        <section className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 mb-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">i</div>
             <h2 className="text-xl font-bold text-white uppercase tracking-tight">Marco Ético y Reglamento</h2>
          </div>
          
          <div className="prose prose-invert prose-emerald max-h-[400px] overflow-y-auto pr-4 mb-8 custom-scrollbar text-slate-300 leading-relaxed font-serif text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
          </div>
          
          <label className="flex items-center gap-4 cursor-pointer group bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-8 h-8 rounded-xl border-2 border-emerald-500 bg-transparent checked:bg-emerald-500 transition-all cursor-pointer"
            />
            <span className="text-md font-bold text-emerald-50">He leído el reglamento y manifiesto mi total conformidad con lo aquí expresado.</span>
          </label>
        </section>

        {/* FORMULARIO (Se desbloquea al aceptar) */}
        <form action={handleSubmit} className={`space-y-6 transition-all duration-700 ${accepted ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
           {/* ... aquí va el resto de tu formulario de ayer ... */}
        </form>
      </div>
    </div>
  );
}