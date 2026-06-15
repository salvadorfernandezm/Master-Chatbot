"use client";

import { useState, Suspense } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function BuzonFormContent({ reglamento }: { reglamento: string }) {
  const searchParams = useSearchParams();
  const isTechnical = searchParams.get("type") === "SOPORTE_TECNICO";

  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR" | "SENDING">("IDLE");
  const [folio, setFolio] = useState("");
  const [accepted, setAccepted] = useState(isTechnical);

  async function handleSubmit(formData: FormData) {
    setStatus("SENDING");
    const result = await createTicket(formData);
    if (result && result.success) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      alert("Error al enviar el reporte.");
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] border-b-8 border-emerald-500">
          <h1 className="text-2xl font-black uppercase mb-4 text-emerald-500">Voz Registrada</h1>
          <div className="bg-black/50 p-6 rounded-3xl mb-8">
            <p className="text-[10px] uppercase font-black mb-2">Tu Folio</p>
            <p className="text-5xl font-black">{folio}</p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-600 px-8 py-3 rounded-2xl font-bold">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500">
            {isTechnical ? "Reporte de Fallo Técnico" : "Buzón de Voz Ética"}
          </h1>
        </header>

        {!isTechnical && !accepted && (
          <section className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 mb-8">
            <div className="prose prose-invert prose-sm max-h-[400px] overflow-y-auto mb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-4 cursor-pointer bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/30">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-6 h-6" />
              <span className="text-sm font-bold">Acepto el reglamento.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6" : "hidden"}>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] space-y-6 border border-white/5">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "DENUNCIA"} />
            
            {!isTechnical && (
              <select name="category" required className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500 text-white">
                <option value="" disabled selected>Selecciona categoría...</option>
                <option value="ACADEMICO">Académico</option>
                <option value="LOGISTICA">Logística</option>
                <option value="GRAVE">Grave / Ética</option>
              </select>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="studentEmail" type="email" placeholder="Correo (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
              <input name="studentName" type="text" placeholder="Nombre (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
            </div>

            <textarea name="content" required rows={5} placeholder="Describe los hechos..." className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500 resize-none"></textarea>
            
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">Adjuntar Evidencias</p>
              <input name="evidence" type="file" multiple className="w-full text-xs text-slate-400" />
            </div>
          </div>
          
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2rem] uppercase hover:bg-white transition-all disabled:opacity-50">
            {status === "SENDING" ? "Enviando..." : "Enviar Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20 italic">Cargando...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}