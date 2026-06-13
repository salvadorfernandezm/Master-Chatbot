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
      alert("Error al enviar el reporte. Por favor revisa los datos.");
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6 text-emerald-500">✓</div>
          <h1 className="text-2xl font-black uppercase mb-4">Voz Registrada</h1>
          <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8 shadow-inner">
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black text-white">{folio}</p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl font-bold transition-all">
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
            {isTechnical ? "Reporte de Fallo Técnico" : "Buzón de Voz Ética"}
          </h1>
        </header>

     {/* 1. Esconder instrucciones de evidencias si es técnico */}
{!isTechnical && (
  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mt-2">
    <p className="text-sm text-amber-800 font-bold flex items-center gap-2">
      <span>💡</span> Instrucciones para evidencias:
    </p>
    <p className="text-sm text-amber-700 mt-1 leading-relaxed">
      Debes mandar todas tus evidencias en <strong>un solo envío</strong>...
    </p>
  </div>
)}

        <form action={handleSubmit} className={accepted ? "space-y-6" : "hidden"}>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            
            {/* SELECTOR DE CATEGORÍA */}
            {!isTechnical ? (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Categoría</label>
                <select name="type" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-sm text-white">
                  <option value="ACADEMICA">Asunto Académico</option>
                  <option value="LOGISTICA">Instalaciones / Logística</option>
                  <option value="GRAVE">Situación Grave / Ética</option>
                </select>
              </div>
            ) : (
              <input type="hidden" name="type" value="SOPORTE_TECNICO" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="studentEmail" type="email" placeholder="Correo (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
              <input name="studentName" type="text" placeholder="Nombre (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm" />
            </div>

            <textarea name="content" required rows={5} placeholder="Describe los hechos..." className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm resize-none"></textarea>
            
          {/* INSTRUCCIONES DEL CLIP MEJORADAS */}
<div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mt-2">
  <p className="text-sm text-amber-800 font-bold flex items-center gap-2">
    <span>💡</span> Instrucciones para evidencias:
  </p>
  <p className="text-sm text-amber-700 mt-1 leading-relaxed">
    Debes mandar todas tus evidencias en <strong>un solo envío</strong>. Selecciónalas todas juntas manteniendo la tecla <strong>Ctrl</strong> (en PC) o marcando varias fotos en tu móvil.
  </p>
</div>

           {/* 2. Esconder aviso de 72 horas si es técnico */}
{!isTechnical && (
  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mb-4 text-center">
    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">⚠️ NOTA IMPORTANTE</p>
    <p className="text-[11px] text-slate-300 mt-1">Al recibir respuesta de la autoridad, tendrás 72 horas para validar...</p>
  </div>
)}
          
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2rem] uppercase shadow-lg hover:bg-white transition-all disabled:opacity-50">
            {status === "SENDING" ? "Enviando..." : "Enviar Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20 italic font-sans">Cargando formulario...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}