"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitAuthorityResponse } from "@/lib/actions";

function ResponderForm() {
  const searchParams = useSearchParams();
  const folio = searchParams.get("folio");

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS">("IDLE");

  useEffect(() => {
    if (folio) {
      fetch(`/api/seguimiento?folio=${folio}`)
        .then(res => res.json())
        .then(data => setTicket(data));
    }
  }, [folio]);

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return null;
    if (['mp4', 'mov', 'webm'].includes(ext || '')) return "🎥 Video";
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return "🎵 Audio";
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    return "📁 Archivo";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await submitAuthorityResponse(formData);
    if (res.success) setStatus("SUCCESS");
    else alert("Hubo un error al guardar.");
    setLoading(false);
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6 text-emerald-500">🏛️</div>
          <h1 className="text-2xl font-black uppercase mb-4">Resolución Guardada</h1>
          <button onClick={() => window.close()} className="mt-8 bg-emerald-600 px-8 py-3 rounded-2xl font-bold uppercase text-xs">Cerrar Ventana</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-800 mb-8 border-l-8 border-emerald-500 pl-4">
          Oficina de Resolución Ética
        </h1>

        {ticket ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <input type="hidden" name="id" value={ticket.id || ""} />

            {/* REPORTE ORIGINAL + EVIDENCIAS DEL ALUMNO */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reporte Original (Folio {folio})</p>
                <p className="text-slate-700 italic font-serif text-lg leading-relaxed">"{ticket.content}"</p>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest">Pruebas presentadas por el alumno:</p>
                  <div className="flex flex-wrap gap-3">
                    {ticket.attachments.map((att: any) => {
                      const icon = getFileIcon(att.url);
                      return (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="group relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-emerald-500 transition-all bg-slate-50 flex items-center justify-center">
                          {icon ? <span className="text-[9px] font-black text-slate-400 text-center uppercase p-1">{icon}</span> : 
                            <img src={att.url} className="h-full w-full object-cover" alt="evidencia" />}
                          <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[8px] text-white font-black bg-emerald-600 px-2 py-1 rounded">VER</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RESPUESTA DE LA AUTORIDAD */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">Resolución Oficial</label>
                <textarea name="responseText" required rows={5} placeholder="Explique las acciones tomadas..." className="w-full p-6 rounded-[2rem] border-2 border-slate-200 focus:border-emerald-500 outline-none text-slate-700" />
              </div>

              <div className="bg-slate-100 p-6 rounded-[2rem] border-2 border-dashed border-slate-300">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Adjuntar Comprobante (Opcional)</label>
                <input name="evidence" type="file" multiple className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-500 file:text-white cursor-pointer" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all uppercase tracking-widest disabled:opacity-50">
                {loading ? "Registrando..." : "Firmar y Resolver Caso"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-20 text-slate-400 italic animate-pulse">Localizando expediente...</div>
        )}
      </div>
    </div>
  );
}

export default function ResponderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white italic">Cargando Despacho...</div>}>
      <ResponderForm />
    </Suspense>
  );
}