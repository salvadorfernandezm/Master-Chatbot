"use client";

import { useState } from "react";
import { createTicket } from "@/app/actions/admin";

export default function PublicBuzonPage() {
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500 animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-2xl font-black uppercase mb-4 tracking-tighter">Reporte Registrado</h1>
          <p className="text-slate-400 mb-8 italic text-sm">"Tu voz ha sido guardada con seguridad."</p>
          <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 mb-8 shadow-inner">
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black text-white tracking-tighter">{folio}</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            IMPORTANTE: Guarda este folio. Es la única forma de consultar la respuesta de la autoridad manteniendo tu anonimato.
          </p>
          <button onClick={() => window.location.reload()} className="mt-8 text-sm text-emerald-500 font-bold hover:underline">Enviar otro reporte</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
            <h1 className="text-4xl font-black uppercase tracking-widest mb-2">Sistema de Voz Ética</h1>
            <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full"></div>
        </header>

        {/* SECCIÓN REGLAMENTO */}
        <section className="bg-slate-800/50 border border-white/10 rounded-[2.5rem] p-8 mb-8">
            <h2 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] mb-4">📜 Reglamento de Uso y Confidencialidad</h2>
            <div className="text-sm text-slate-300 space-y-4 max-h-48 overflow-y-auto pr-4 custom-scrollbar leading-relaxed mb-6 font-serif">
                <p>1. <strong>Protección de Identidad:</strong> El sistema genera un folio único. No es obligatorio proporcionar tu nombre real.</p>
                <p>2. <strong>Uso Responsable:</strong> Este buzón es para denuncias de ética, asuntos académicos o logística. El uso para bromas o acoso será desestimado.</p>
                <p>3. <strong>Evidencias:</strong> Se recomienda adjuntar fotos o documentos que sustenten el reporte para una resolución más rápida.</p>
                <p>4. <strong>Seguimiento:</strong> La autoridad tiene un plazo de 5 días hábiles para emitir una respuesta inicial.</p>
                <p>5. <strong>Conformidad:</strong> Al enviar este formulario, manifiestas que la información proporcionada es verídica.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                    type="checkbox" 
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-emerald-500 bg-transparent checked:bg-emerald-500 transition-all cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">He leído el reglamento y manifiesto mi conformidad.</span>
            </label>
        </section>

        <form action={handleSubmit} className={`space-y-6 transition-all duration-700 ${accepted ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
          <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            
            {/* Tipo de Reporte */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 ml-2">Tipo de situación</label>
              <select name="type" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm">
                <option value="ACADEMICA">Asunto Académico</option>
                <option value="LOGISTICA">Instalaciones / Logística</option>
                <option value="GRAVE">Situación Grave / Ética</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Correo (Opcional)</label>
                <input name="studentEmail" type="email" placeholder="Para recibir el folio por mail" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Tu Nombre (Opcional)</label>
                <input name="studentName" type="text" placeholder="Mantener en blanco para anónimo" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none text-sm" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Descripción del caso</label>
              <textarea name="content" required rows={5} placeholder="Describe los hechos, fechas y personas involucradas..." className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none resize-none text-sm"></textarea>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Adjuntar Evidencia (Clip 📎)</label>
              <input name="evidence" type="file" className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-slate-950 hover:file:bg-white transition-all cursor-pointer" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === "SENDING"}
            className="w-full bg-emerald-500 hover:bg-white text-slate-950 font-black py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
          >
            {status === "SENDING" ? "Registrando..." : "Enviar Reporte y Generar Folio"}
          </button>
        </form>
      </div>
    </div>
  );
}