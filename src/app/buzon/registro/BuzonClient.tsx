"use client";

import { useState, Suspense } from "react";
import { createTicket } from "@/app/actions";
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
      const names = Array.from(e.target.files).map(f => f.name);
      setSelectedFiles(names);
    }
  };

  async function handleSubmit(formData: FormData) {
    setStatus("SENDING");
    const result = await createTicket(formData);
    if (result && result.success) {
      setFolio(result.folio);
      setStatus("SUCCESS");
    } else {
      alert("Error al enviar. Intenta de nuevo.");
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-black uppercase mb-4 tracking-tighter">Voz Registrada</h1>
          <div className="bg-black p-8 rounded-3xl mb-8 border border-white/10">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Folio de Seguimiento</p>
            <p className="text-5xl font-black">{folio}</p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black uppercase text-sm w-full">Finalizar</button>
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
            {/* PUNTO 4: Quitamos 'italic' aquí */}
            <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto mb-10 pr-4 custom-scrollbar text-slate-300 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-5 cursor-pointer bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/30">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-8 h-8 rounded-lg text-emerald-500" />
              <span className="text-sm font-bold">He leído el reglamento y acepto proceder.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6" : "hidden"}>
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 space-y-8">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "DENUNCIA"} />
            
            {!isTechnical && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">¿Categoría del reporte?</label>
                <select 
                  name="category" 
                  required 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-white"
                >
                  <option value="" disabled>Selecciona una...</option>
                  <option value="ACADEMICO">Académico</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="GRAVE">Grave / Ética (Requiere Identificación)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Email {category === "GRAVE" && <span className="text-red-500">*Obligatorio</span>}
                </label>
                <input 
                  name="studentEmail" 
                  type="email" 
                  required={category === "GRAVE"}
                  placeholder="ejemplo@correo.com" 
                  className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Nombre {category === "GRAVE" && <span className="text-red-500">*Obligatorio</span>}
                </label>
                <input 
                  name="studentName" 
                  type="text" 
                  required={category === "GRAVE"}
                  placeholder="Tu nombre completo" 
                  className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm" 
                />
              </div>
            </div>

            <textarea name="content" required rows={6} placeholder="Describe los hechos con detalle..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm outline-none focus:border-emerald-500 resize-none"></textarea>
            
            {/* INSTRUCCIONES DE EVIDENCIAS MEJORADAS */}
<div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-[2rem] space-y-4">
  <div className="flex items-start gap-4">
    <span className="text-2xl">⚠️</span>
    <div>
      <p className="text-xs font-black text-amber-500 uppercase tracking-widest text-left">Avisos Importantes</p>
      <ul className="text-[10px] text-slate-300 mt-2 space-y-1 list-disc ml-4 text-left">
        <li><strong>Límite de tamaño:</strong> El total de archivos no debe superar los <strong>4MB</strong>.</li>
        <li><strong>Multiformato:</strong> Aceptamos fotos, audios, videos cortos y PDFs.</li>
        <li><strong>Plazo de validación:</strong> Una vez resuelto, tendrás <strong>72 horas</strong> para confirmar si estás satisfecho.</li>
      </ul>
    </div>
  </div>
  
  <div className="relative group">
    <input name="evidence" type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
    <div className="bg-slate-800 border-2 border-dashed border-slate-600 p-6 rounded-2xl text-center group-hover:border-emerald-500 transition-all">
      <p className="text-xs font-bold text-slate-400 group-hover:text-emerald-400">📎 Seleccionar evidencias (Máx. 4MB total)</p>
    </div>
  </div>

  {selectedFiles.length > 0 && (
    <div className="bg-black/30 p-4 rounded-xl space-y-2">
      <p className="text-[10px] font-bold text-emerald-500 uppercase italic text-left">
        {selectedFiles.length} archivo(s) listo(s):
      </p>
      <ul className="text-[10px] text-slate-400 list-disc ml-4 text-left">
        {selectedFiles.map((name, i) => <li key={i}>{name}</li>)}
      </ul>
    </div>
  )}
</div>
          
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.5rem] uppercase hover:bg-white transition-all disabled:opacity-50">
            {status === "SENDING" ? "Procesando..." : "Enviar Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20 italic font-serif">Cargando Buzón...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}