"use client";

import { useState, useEffect } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BuzonPublico() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Cambiamos la ruta de /api/admin/settings a /api/settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings'); // <-- LA NUEVA LIGADURA
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error("Error cargando el reglamento");
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-10 font-sans">
      
      {/* VENTANA EMERGENTE: EL REGLAMENTO CON MARKDOWN */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-6 text-center">Reglamento del Buzón</h3>
            <div className="max-h-[50vh] overflow-y-auto mb-8 pr-2">
              <div className="prose prose-slate prose-sm text-slate-700 italic leading-relaxed">
                {/* Aquí la varita mágica que lee Markdown de tus Ajustes */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {settings?.organizationBuzonInfo || "Cargando reglamento oficial..."}
                </ReactMarkdown>
              </div>
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              He leído y acepto los términos
            </button>
          </div>
        </div>
      )}

      {/* TARJETA PRINCIPAL DEL BUZÓN */}
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        
        {/* ENCABEZADO CON BOTÓN "i" INTEGRADO */}
        <div className="bg-slate-950 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/20 to-transparent pointer-events-none" />
          <div className="z-10">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Buzón Inteligente</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">
               Voz y Vez para el Estudiante
            </p>
          </div>
          
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="z-20 h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-serif italic text-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-90 ring-4 ring-white/10 animate-pulse"
          >
            i
          </button>
        </div>

        <form action={createTicket} className="p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Reporte</label>
              <select name="type" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700 appearance-none shadow-inner">
                <option value="SUGERENCIA">💡 Sugerencia de Mejora</option>
                <option value="ACADEMICA">🎓 Asunto Académico</option>
                <option value="INFRAESTRUCTURA">🚧 Instalaciones/Limpieza</option>
                <option value="GRAVE">🚨 Reporte Confidencial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidad (Nombre)</label>
              <input name="studentName" placeholder="Opcional si no es reporte grave" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm shadow-inner" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje para el Comité</label>
            <textarea name="content" required rows={5} placeholder="Tu voz es importante. Exprésate con respeto..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed shadow-inner" />
          </div>

          {/* ESPACIO PARA EVIDENCIAS (PROXIMAMENTE) */}
          <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <span className="text-2xl opacity-40">📎</span>
             <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
               El cargador de evidencias (audio, video, fotos) estará disponible en la Fase Beta II.
             </p>
          </div>

          <button type="submit" className="w-full py-5 bg-slate-950 text-white font-black uppercase tracking-[0.3em] text-xs rounded-[1.5rem] shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span>ENVIAR MI REPORTE</span>
            <span className="text-xl">↗</span>
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Master IA System — Salvador Fernández M.</p>
      </footer>
    </div>
  );
}