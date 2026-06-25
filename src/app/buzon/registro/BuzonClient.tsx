"use client";

import { useState, Suspense } from "react";
import { createTicket } from "@/lib/actions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from "next/navigation";

function BuzonFormContent({ reglamento }: { reglamento: string }) {
  const searchParams = useSearchParams();
  const isTechnical = searchParams.get("type") === "SOPORTE_TECNICO";

  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR" | "SENDING">("IDLE");
  const [folio, setFolio] = useState("");
  const [accepted, setAccepted] = useState(isTechnical);
  const [category, setCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files).map(f => f.name));
    }
  };

  async function handleSubmit(formData: FormData) {
    setStatus("SENDING");
    const result = await createTicket(formData);
    if (result && result.success) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      alert("Error al enviar.");
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-b-8 border-emerald-500 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-black uppercase mb-4 tracking-tighter text-emerald-500">¡Voz Registrada!</h1>
          
          <div className="bg-black p-8 rounded-3xl mb-6 border border-white/10 relative overflow-hidden">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black tracking-tight">{folio}</p>
          </div>

          {/* EL NUEVO AVISO DE ALTA VISIBILIDAD */}
          <div className="bg-amber-500/10 border-2 border-amber-500/50 p-6 rounded-2xl mb-8 animate-pulse">
            <p className="text-amber-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
              ⚠️ ¡ACCIÓN NECESARIA!
            </p>
            <p className="text-[11px] text-slate-200 mt-2 leading-relaxed">
              <strong>Guarda o toma captura de este folio ahora.</strong> Sin él, será imposible consultar tu respuesta o dar seguimiento al caso.
            </p>
          </div>

          <button 
            onClick={() => window.location.assign("/buzon")} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm w-full transition-all active:scale-95"
          >
            Entendido, volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans text-left">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500">
            {isTechnical ? "⚙️ Fallo Técnico" : "✍️ Nuevo Reporte"}
          </h1>
        </header>

        {!isTechnical && !accepted && (
          <section className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-black uppercase mb-6 text-emerald-400">Reglamento</h2>
            <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto mb-10 pr-4 custom-scrollbar text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-5 cursor-pointer bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/30">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-8 h-8 rounded-lg border-emerald-500 bg-transparent text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm font-bold">He leído el reglamento y acepto proceder con honestidad.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6 animate-in fade-in" : "hidden"}>
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "DENUNCIA"} />
            
            {!isTechnical && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest ml-2">¿Categoría del reporte?</label>
                <select name="category" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer">
                  <option value="" disabled>Selecciona una...</option>
                  <option value="ACADEMICO">Académico</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="GRAVE">Grave / Ética (Requiere Identificación)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email {category === "GRAVE" && <span className="text-red-500">*</span>}</label>
                <input name="studentEmail" type="email" required={category === "GRAVE"} placeholder="Para recibir avisos..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre {category === "GRAVE" && <span className="text-red-500">*</span>}</label>
                <input name="studentName" type="text" required={category === "GRAVE"} placeholder="Tu nombre o Anónimo..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Descripción de los hechos</label>
              <textarea name="content" required rows={6} placeholder="Describe aquí con detalle..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm outline-none focus:border-emerald-500 resize-none"></textarea>
            </div>
            
            <div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-[2rem] space-y-4">
              <p className="text-[11px] text-amber-500 font-black uppercase tracking-widest">📸 Instrucciones de Evidencias</p>
              
              <div className="relative group">
                <input name="evidence" type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-slate-800 border-2 border-dashed border-slate-600 p-6 rounded-2xl text-center group-hover:border-emerald-500 transition-all">
                  <p className="text-xs font-bold text-slate-400 group-hover:text-emerald-400">📎 Clic para adjuntar archivos juntos</p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="bg-black/30 p-4 rounded-xl space-y-2 text-[10px]">
                  <p className="font-bold text-emerald-500 uppercase italic">{selectedFiles.length} archivo(s) seleccionado(s):</p>
                  <ul className="text-slate-400 list-disc ml-4">
                    {selectedFiles.map((name, i) => <li key={i}>{name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.5rem] uppercase hover:bg-white transition-all shadow-xl disabled:opacity-50 text-lg tracking-widest">
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