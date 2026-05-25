"use client";

import { useState } from "react";
import { createTicket } from "@/app/actions/admin";

export default function PublicBuzonPage() {
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [folio, setFolio] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await createTicket(formData);
    if (result?.success) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-2xl font-black uppercase mb-4">Reporte Recibido</h1>
          <p className="text-slate-400 mb-8 italic">"Tu voz ha sido guardada. El cambio comienza hoy."</p>
          <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 mb-8">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Tu Folio Secreto</p>
            <p className="text-4xl font-black text-emerald-400 tracking-tighter">{folio}</p>
          </div>
          <p className="text-xs text-slate-500">Guarda este folio para dar seguimiento a tu reporte de forma anónima.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Centro de Voz Ética</h1>
        <p className="text-slate-400 italic mb-10 underline decoration-emerald-500 decoration-2 underline-offset-8">
          Reporta de forma segura. Tu identidad está protegida.
        </p>

        <form action={handleSubmit} className="space-y-6">
          <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            
            {/* Tipo de Reporte */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 ml-2">Tipo de situación</label>
              <select name="type" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all">
                <option value="ACADEMICA">Asunto Académico</option>
                <option value="LOGISTICA">Instalaciones / Logística</option>
                <option value="GRAVE">Situación Grave / Ética</option>
              </select>
            </div>

            {/* Correo y Nombre (Opcionales) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Tu Correo (Opcional)</label>
                <input name="studentEmail" type="email" placeholder="Para recibir notificaciones" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Tu Nombre (Opcional)</label>
                <input name="studentName" type="text" placeholder="Mantener en blanco para anónimo" className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none" />
              </div>
            </div>

            {/* Contenido */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Descripción del caso</label>
              <textarea name="content" required rows={5} placeholder="Cuéntanos qué sucedió con el mayor detalle posible..." className="w-full bg-slate-950 border-2 border-slate-700 p-4 rounded-2xl focus:border-emerald-500 outline-none resize-none"></textarea>
            </div>

            {/* Evidencia (El Clip 📎) */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Adjuntar Evidencia (Clip)</label>
              <input name="evidence" type="file" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer" />
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
            Enviar Reporte y Generar Folio
          </button>
        </form>
      </div>
    </div>
  );
}