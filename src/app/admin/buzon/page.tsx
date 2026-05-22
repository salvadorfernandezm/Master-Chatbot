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
      try {
        const res = await fetch('/api/settings'); 
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error("Error cargando configuración");
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-10 font-sans">
      
      {/* VENTANA EMERGENTE (MODAL i) - DISEÑO INSTITUCIONAL */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-8 text-center underline decoration-2 underline-offset-8">Reglamento Ético del Buzón</h3>
            
            <div className="max-h-[60vh] overflow-y-auto mb-8 pr-4">
              {/* CORRECCIÓN: Quitamos el FLEX para que el texto no explote */}
              <div className="prose prose-slate max-w-none 
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-justify
                prose-strong:text-emerald-700 prose-strong:font-bold
                prose-li:text-slate-600 prose-li:mb-2">
                
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Títulos sin FLEX para que no se rompan
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-slate-800 mt-10 mb-6 border-b pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-emerald-800 mt-6 mb-3" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-black text-slate-700 mt-10 mb-4 block leading-tight" {...props} />,
                    h5: ({node, ...props}) => <h5 className="text-sm font-bold text-slate-600 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-6 leading-relaxed text-slate-600" {...props} />,
                    // Aseguramos que el STRONG sea siempre en línea
                    strong: ({node, ...props}) => <strong className="font-bold text-emerald-800 inline" {...props} />,
                  }}
                >
                  {settings?.organizationBuzonInfo || "_Cargando reglamento oficial..._"}
                </ReactMarkdown>
              </div>
            </div>
            
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all"
            >
              He leído y acepto los términos
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DEL BUZÓN */}
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-transparent pointer-events-none" />
          <div className="z-10">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Buzón Inteligente</h1>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">
               Voz y Vez: Mejora Continua
            </p>
          </div>
          
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="z-20 h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-serif italic text-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-90 ring-4 ring-white/10 animate-pulse"
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
          className="p-10 md:p-12 space-y-8"
        >
          {status === "success" && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-bold text-sm animate-bounce border border-emerald-100">
              ✅ Tu reporte ha sido enviado con éxito.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Tipo de Reporte</label>
              <select name="type" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm shadow-inner text-center">
                <option value="SUGERENCIA">💡 Sugerencia</option>
                <option value="ACADEMICA">🎓 Asunto Académico</option>
                <option value="INFRAESTRUCTURA">🚧 Instalaciones</option>
                <option value="GRAVE">🚨 Reporte Grave</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Identidad (Nombre)</label>
              <input name="studentName" placeholder="Opcional" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm shadow-inner text-center" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Mensaje</label>
            <textarea name="content" required rows={5} placeholder="Tu voz es importante..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed shadow-inner" />
          </div>

          <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-xs rounded-[1.5rem] shadow-2xl hover:bg-black active:scale-[0.98] transition-all">
            ENVIAR REPORTE ↗
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center opacity-40">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Salvador Fernández M.</p>
      </footer>
    </div>
  );
}