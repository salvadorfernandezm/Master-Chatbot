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
  
  // ESTA ES LA LÍNEA QUE FALTABA (EL CONTROL REMOTO)
  const [program, setProgram] = useState("Psicología");
  
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
      alert("Error al enviar. Por favor revisa que todos los campos obligatorios estén llenos.");
      setStatus("ERROR");
    }
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-b-8 border-emerald-500 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-black uppercase mb-4 text-emerald-500">¡Voz Registrada!</h1>
          <div className="bg-black p-8 rounded-3xl mb-6 border border-white/10">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2 text-left">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black tracking-tight">{folio}</p>
          </div>
          <div className="bg-amber-500/10 border-2 border-amber-500/50 p-6 rounded-2xl mb-8 animate-pulse">
            <p className="text-amber-500 text-xs font-black uppercase tracking-widest">⚠️ ¡ACCIÓN NECESARIA!</p>
            <p className="text-[11px] text-slate-200 mt-2 leading-relaxed">
              Guarda este folio. Sin él, no podrás consultar tu respuesta.
            </p>
          </div>
          <button onClick={() => window.location.assign("/buzon")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm w-full transition-all">Finalizar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans text-left text-left">
      <div className="max-w-3xl mx-auto text-left">
        <header className="mb-12 text-left">
          <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-500 text-left">
            {isTechnical ? "⚙️ Fallo Técnico" : "✍️ Nuevo Reporte"}
          </h1>
        </header>

        {!isTechnical && !accepted && (
          <section className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 mb-8 text-left">
            <h2 className="text-xl font-black uppercase mb-6 text-emerald-400 text-left">Reglamento</h2>
            <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto mb-10 pr-4 custom-scrollbar text-slate-300 text-left text-left">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reglamento}</ReactMarkdown>
            </div>
            <label className="flex items-center gap-5 cursor-pointer bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/30 text-left">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-8 h-8 rounded-lg border-emerald-500 bg-transparent text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm font-bold text-left">He leído el reglamento y acepto proceder con identidad y honestidad.</span>
            </label>
          </section>
        )}

        <form action={handleSubmit} className={accepted ? "space-y-6 text-left" : "hidden"}>
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl text-left text-left">
            <input type="hidden" name="type" value={isTechnical ? "SOPORTE_TECNICO" : "DENUNCIA"} />
            
            {/* SECCIÓN ACADÉMICA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 text-left">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-emerald-500 ml-2 text-left">Programa Académico</label>
                    <select 
                        name="academicProgram" 
                        required 
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500 text-left"
                    >
                        <option value="Psicología">Lic. en Psicología</option>
                        <option value="Terapia">Lic. en Terapia de la Com. Humana</option>
                        <option value="Posgrado">Posgrado</option>
                    </select>
                </div>

                {/* MODALIDAD SOLO SI ES PSICOLOGÍA */}
                {program === "Psicología" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 text-left">
                        <label className="text-[10px] font-black uppercase text-emerald-500 ml-2 text-left">Modalidad</label>
                        <select name="modality" required className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500 text-left text-left">
                            <option value="Presencial">Presencial</option>
                            <option value="Virtual">Virtual</option>
                        </select>
                    </div>
                )}
            </div>

            {/* DATOS OBLIGATORIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 text-left block text-left">Nombre Completo</label>
                    <input name="studentName" required minLength={5} placeholder="Escribe tu nombre..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-2xl text-sm outline-none focus:border-emerald-500 text-left" />
                </div>
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 text-left block text-left">Correo Institucional</label>
                    <input name="studentEmail" type="email" required placeholder="ejemplo@ujed.mx" className="w-full bg-black border-2 border-slate-800 p-5 rounded-2xl text-sm outline-none focus:border-emerald-500 text-left" />
                </div>
            </div>

            <div className="space-y-3 text-left">
              {!isTechnical && (
                <div className="space-y-2 mb-6 text-left">
                    <label className="text-[10px] font-black uppercase text-emerald-500 ml-2 text-left">Categoría del reporte</label>
                    <select name="category" required className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-white text-left">
                        <option value="ACADEMICO">Académico</option>
                        <option value="LOGISTICA">Logística / Servicios</option>
                        <option value="GRAVE">Grave / Ética</option>
                    </select>
                </div>
              )}
              <label className="text-[10px] font-black text-emerald-500 uppercase ml-2 text-left">Descripción de los hechos</label>
              <textarea name="content" required rows={6} placeholder="Escribe aquí con detalle..." className="w-full bg-black border-2 border-slate-800 p-5 rounded-2xl text-sm outline-none focus:border-emerald-500 resize-none text-left"></textarea>
            </div>
            
            <div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-[2rem] space-y-4 text-left">
              <p className="text-[11px] text-amber-500 font-black uppercase tracking-widest text-left">📸 Evidencias</p>
              <input name="evidence" type="file" multiple onChange={handleFileChange} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-black transition-all cursor-pointer text-left" />
              {selectedFiles.length > 0 && (
                <p className="text-[10px] text-emerald-500 italic text-left">{selectedFiles.length} archivo(s) seleccionado(s)</p>
              )}
            </div>
          </div>
          
          <button type="submit" disabled={status === "SENDING"} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.5rem] uppercase hover:bg-white transition-all shadow-xl disabled:opacity-50 text-lg text-left flex justify-center">
            {status === "SENDING" ? "Enviando..." : "Enviar Reporte Oficial"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuzonClient({ reglamento }: { reglamento: string }) {
  return (
    <Suspense fallback={<div className="text-white text-center p-20 italic text-left">Cargando Buzón...</div>}>
      <BuzonFormContent reglamento={reglamento} />
    </Suspense>
  );
}