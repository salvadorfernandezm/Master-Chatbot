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
    if (result && result.folio) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6 text-emerald-500">✓</div>
          <h1 className="text-2xl font-black uppercase mb-4">Voz Registrada</h1>
          <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8 shadow-inner">
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black text-white">{folio}</p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-600 px-8 py-3 rounded-2xl font-bold">
            Volver al Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/buzon" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase mb-10">
           ← Volver al Portal
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500">
            {isTechnical ? "Reporte Técnico" : "Buzón Ético"}
          </h1>
        </header>

        {!isTechnical && (
          <section className={`bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 mb-8 transition-all ${accepted ? 'hidden' : 'block'}`}>
            <h2 className="text-xl font-bold text-white uppercase mb-4">Reglamento</h2>
            <div className="prose prose-invert prose-sm max-h-[400px] overflow-y-auto mb-8 text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-4 cursor-pointer bg-emerald-500/10 p-6 rounded-3xl">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-6 h-6 border-emerald-500" />
              <span>He leído y acepto las condiciones.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6" : "hidden"}>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "ACADEMICA"} />
            <input name="studentEmail" type="email" placeholder="Correo (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
            <input name="studentName" type="text" placeholder="Nombre (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
            <textarea name="content" required rows={5} placeholder="Describe los hechos..." className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm resize-none"></textarea>
          </div>
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2rem] uppercase disabled:opacity-50">
            {status === "SENDING" ? "Enviando..." : "Enviar Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20">Cargando...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}