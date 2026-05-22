"use client";

import { useState, useEffect } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BuzonPublico() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/settings'); 
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-10 font-sans">
      
      {/* VENTANA EMERGENTE: EL REGLAMENTO CON ESTILOS MEJORADOS */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-emerald-100">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-6 text-center">Reglamento Ético del Buzón</h3>
            
            <div className="max-h-[60vh] overflow-y-auto mb-8 pr-4 custom-scrollbar">
              {/* LA MAGIA: Clase 'prose' para que los #### y los guiones funcionen */}
              <div className="prose prose-slate max-w-none 
                prose-headings:text-slate-800 prose-headings:font-black
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-li:text-slate-600
                prose-strong:text-emerald-700 prose-strong:font-bold">
                <ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  components={{
    // Esto asegura que si dejas una línea en blanco, se respete como párrafo nuevo
    p: ({node, ...props}) => <p className="mb-5 last:mb-0" {...props} />
  }}
>
  {settings?.organizationBuzonInfo || "_Cargando reglamento..._"}
</ReactMarkdown>
              </div>
            </div>
            
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              He leído y acepto los términos
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DEL BUZÓN (Igual que ayer, pero aseguramos la acción) */}
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-transparent" />
          <div className="z-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter">Buzón Inteligente</h1>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
               Voz y Vez: Mejora Continua
            </p>
          </div>
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="z-20 h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center font-serif italic text-3xl hover:bg-emerald-400 transition-all shadow-lg ring-8 ring-emerald-500/20 animate-pulse"
          >
            i
          </button>
        </div>

        <form 
          action={async (formData) => {
            await createTicket(formData);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 5000);
          }} 
          className="p-10 space-y-8"
        >
          {status === "success" && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-bold text-sm animate-bounce">
              ✅ Tu reporte ha sido enviado con éxito.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Asunto</label>
              <select name="type" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700 shadow-inner">
                <option value="SUGERENCIA">💡 Sugerencia de Mejora</option>
                <option value="ACADEMICA">🎓 Asunto Académico</option>
                <option value="INFRAESTRUCTURA">🚧 Instalaciones/Limpieza</option>
                <option value="GRAVE">🚨 Reporte Confidencial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Identidad (Nombre)</label>
              <input name="studentName" placeholder="Anónimo (opcional)" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm shadow-inner" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción</label>
            <textarea name="content" required rows={5} placeholder="Tu voz cuenta..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 resize-none text-sm" />
          </div>

          <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-black transition-all shadow-xl">
            ENVIAR REPORTE
          </button>
        </form>
      </div>
    </div>
  );
}