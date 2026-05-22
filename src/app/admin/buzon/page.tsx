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
        console.error("Error al conectar con el búnker de ajustes");
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-10 font-sans">
      
      {/* VENTANA EMERGENTE (MODAL i) - DISEÑO SEGURO */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700 mb-6 text-center">Reglamento Ético del Buzón</h3>
            
            <div className="flex-1 overflow-y-auto mb-8 pr-2">
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-justify">
                {/* RECTIFICACIÓN: Quitamos cualquier instrucción de estilo personalizada que pudiera chocar */}
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Forzamos que las negritas y otros elementos sean SIEMPRE simples y fluyan con el texto
                    strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4" {...props} />,
                    h4: ({node, ...props}) => <h4 className="font-black text-slate-800 mt-8 mb-2 border-l-4 border-emerald-500 pl-3" {...props} />
                  }}
                >
                  {settings?.organizationBuzonInfo || "Cargando información oficial..."}
                </ReactMarkdown>
              </div>
            </div>
            
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg"
            >
              Cerrar Reglamento
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO PRINCIPAL */}
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-300">
        <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-emerald-600/10 to-transparent pointer-events-none" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Buzón Inteligente</h1>
            <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80">La Vez y la Voz del Alumno</p>
          </div>
          
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-serif italic text-2xl hover:bg-emerald-500 shadow-xl active:scale-90 animate-pulse ring-4 ring-white/10"
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
            <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl text-center font-bold text-sm">
              ✅ Reporte enviado con éxito al Maestro.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Reporte</label>
              <select name="type" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm font-bold">
                <option value="SUGERENCIA">💡 Sugerencia</option>
                <option value="ACADEMICA">🎓 Académico</option>
                <option value="INFRAESTRUCTURA">🚧 Instalaciones</option>
                <option value="GRAVE">🚨 Reporte Grave</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tu Identidad</label>
              <input name="studentName" placeholder="Anónimo" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm shadow-inner" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tu Mensaje</label>
            <textarea name="content" required rows={5} placeholder="Describe aquí tu inquietud con respeto..." className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 resize-none text-sm leading-relaxed" />
          </div>

          <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-2xl hover:bg-black transition-all active:scale-[0.98]">
            ENVIAR REPORTE AHORA
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center opacity-30 italic">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Arquitectura: Salvador Fernández M.</p>
      </footer>
    </div>
  );
}