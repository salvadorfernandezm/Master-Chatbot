"use client";

import { useState, useEffect } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BuzonPublico() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
      
      {/* VENTANA EMERGENTE (MODAL i) - EL REGLAMENTO */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-6 text-center underline decoration-2 underline-offset-8">Reglamento Ético del Buzón</h3>
            
            <div className="flex-1 overflow-y-auto mb-8 pr-2">
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-justify">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {settings?.organizationBuzonInfo || "Cargando información oficial..."}
                </ReactMarkdown>
              </div>
            </div>
            
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg"
            >
              He leído y acepto los términos
            </button>
          </div>
        </div>
      )}

      {/* TARJETA PRINCIPAL DEL BUZÓN */}
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-300">
        
        {/* ENCABEZADO CON EL FARO ESMERALDA */}
        <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/10 to-transparent pointer-events-none" />
          <div className="z-10">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Buzón Inteligente</h1>
            <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-widest mt-2 italic opacity-80">La Vez y la Voz del Estudiante</p>
          </div>
          
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center font-serif italic text-3xl hover:bg-emerald-400 transition-all shadow-lg active:scale-90 animate-pulse ring-8 ring-emerald-500/10"
            title="Información importante"
          >
            i
          </button>
        </div>

        <form 
          action={async (formData) => {
            try {
              await createTicket(formData);
              setStatus("success");
              setSelectedFile(null);
              // Limpiamos el formulario manualmente
              const form = document.querySelector('form') as HTMLFormElement;
              form.reset();
              setTimeout(() => setStatus("idle"), 6000);
            } catch (e) {
              setStatus("error");
            }
          }} 
          className="p-8 md:p-12 space-y-8"
        >
          {status === "success" && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-bold text-sm border border-emerald-100 animate-in fade-in slide-in-from-top-4">
              ✅ Tu reporte y evidencia han sido enviados con éxito.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Reporte</label>
              <select name="type" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700 text-sm appearance-none cursor-pointer">
                <option value="SUGERENCIA">💡 Sugerencia de Mejora</option>
                <option value="ACADEMICA">🎓 Asunto Académico</option>
                <option value="INFRAESTRUCTURA">🚧 Instalaciones/Limpieza</option>
                <option value="GRAVE">🚨 Reporte Grave (Confidencial)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidad (Opcional)</label>
              <input name="studentName" placeholder="Escribe tu nombre o 'Anónimo'" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm shadow-inner" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Hecho</label>
            <textarea name="content" required rows={4} placeholder="Por favor, exprésate con claridad y respeto..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed" />
          </div>

          {/* --- AQUÍ ESTÁ EL CLIP DE EVIDENCIAS PURIFICADO--- */}
          {/* --- BLOQUE DE EVIDENCIAS PURIFICADO --- */}
<div className="space-y-4">
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">
    📦 Evidencia de Respaldo
  </p>
  <div className="relative">
    {/* Ponemos accept de forma más sencilla para que el móvil no se confunda */}
    <input 
      type="file" 
      name="evidence" 
      id="evidence" 
      className="sr-only" // 'sr-only' es una forma más limpia de ocultar el botón feo de Windows
      onChange={(e) => {
          const file = e.target.files?.[0];
          setSelectedFile(file ? file.name : null);
      }}
    />
    <label 
      htmlFor="evidence" 
      className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${
        selectedFile 
          ? 'bg-emerald-50 border-emerald-500' 
          : 'bg-slate-50 border-slate-300 hover:bg-white hover:border-emerald-400'
      }`}
    >
      {/* Solo un icono grande para evitar la duplicidad de camaritas */}
      <span className="text-4xl filter grayscale-[0.5]">
        {selectedFile ? '📝' : '📎'}
      </span>
      <div className="text-center">
        <p className={`text-xs font-black uppercase tracking-widest ${selectedFile ? 'text-emerald-700' : 'text-slate-500'}`}>
          {selectedFile ? 'Evidencia cargada' : 'Adjuntar Pruebas'}
        </p>
        <p className="text-[9px] text-slate-400 mt-1 italic max-w-[180px] truncate mx-auto">
          {selectedFile ? selectedFile : '(Fotos, capturas o audios)'}
        </p>
      </div>
    </label>
  </div>
</div>

          <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
            <span>ENVIAR MI REPORTE</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">↗</span>
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center opacity-30 italic">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Arquitectura Digital Salvador Fernández M.</p>
      </footer>
    </div>
  );
}