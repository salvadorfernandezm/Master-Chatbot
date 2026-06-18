"use client";

import { useState, Suspense } from "react";
import { createTicket } from "../../../lib/actions";
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans text-left">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6 text-left">✅</div>
          <h1 className="text-3xl font-black uppercase mb-4 text-left">Enviado</h1>
          <div className="bg-black p-8 rounded-3xl mb-8 border border-white/10 text-left">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Tu Folio</p>
            <p className="text-5xl font-black">{folio}</p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black uppercase text-sm w-full">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans text-left">
      <div className="max-w-3xl mx-auto text-left">
        <header className="mb-12 text-left">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500 text-left">
            {isTechnical ? "⚙️ Fallo Técnico" : "✍️ Nuevo Reporte"}
          </h1>
        </header>

        {!isTechnical && !accepted && (
          <section className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 mb-8 text-left">
            <h2 className="text-xl font-black uppercase mb-6 text-emerald-400 text-left">Reglamento</h2>
            <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto mb-10 pr-4 text-slate-300 text-left">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-5 cursor-pointer bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/30 text-left">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-8 h-8 rounded-lg text-emerald-500" />
              <span className="text-sm font-bold text-left">Acepto el reglamento.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6 text-left" : "hidden"}>
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 space-y-8 text-left">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "DENUNCIA"} />
            
            {!isTechnical && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest text-left">Categoría</label>
                <select name="category" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-white text-left">
                  <option value="" disabled>Selecciona una...</option>
                  <option value="ACADEMICO">Académico</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="GRAVE">Grave / Ética</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <input name="studentEmail" type="email" required={category === "GRAVE"} placeholder="Email" className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-left" />
              <input name="studentName" type="text" required={category === "GRAVE"} placeholder="Nombre" className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-left" />
            </div>

            <textarea name="content" required rows={6} placeholder="Descripción..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-[1.5rem] text-sm text-left resize-none"></textarea>
            
            <div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-[2rem] space-y-4 text-left">
              <p className="text-[11px] text-amber-500 font-black uppercase tracking-widest text-left">Avisos</p>
              <ul className="text-[10px] text-slate-300 list-disc ml-4 text-left">
                <li>Máximo 4MB total.</li>
                <li>Tienes 72h para validar la solución.</li>
              </ul>
              <div className="relative group text-left">
                <input name="evidence" type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-slate-800 border-2 border-dashed border-slate-600 p-6 rounded-2xl text-center">
                  <p className="text-xs font-bold text-slate-400 text-left">📎 Adjuntar archivos</p>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="text-[10px] text-emerald-500 italic text-left">
                  {selectedFiles.length} archivo(s) seleccionado(s).
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.5rem] uppercase text-left justify-center flex">
            {status === "SENDING" ? "Enviando..." : "Enviar Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20 italic text-left">Cargando...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}