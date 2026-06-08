"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitAuthorityResponse } from "@/app/actions/admin";

function ResponderForm() {
  const searchParams = useSearchParams();
  const folio = searchParams.get("folio");

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS">("IDLE");

  // Buscamos los datos del ticket al cargar
  useEffect(() => {
    if (folio) {
      fetch(`/api/seguimiento?folio=${folio}`)
        .then(res => res.json())
        .then(data => setTicket(data));
    }
  }, [folio]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await submitAuthorityResponse(formData);
    
    if (res.success) {
      setStatus("SUCCESS");
    } else {
      alert("Hubo un error al guardar la respuesta.");
    }
    setLoading(false);
  }

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6 text-emerald-500">🏛️</div>
          <h1 className="text-2xl font-black uppercase mb-4">Resolución Guardada</h1>
          <p className="text-slate-400 italic">"La respuesta ha sido registrada y el folio se ha marcado como RESUELTO."</p>
          <button 
            onClick={() => window.close()} 
            className="mt-8 bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl font-bold transition-all"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-800 mb-8 border-l-8 border-emerald-500 pl-4">
          Oficina de Resolución Ética
        </h1>

        {ticket ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ID OCULTO PARA EL SERVIDOR */}
            <input type="hidden" name="id" value={ticket.id || ""} />

            {/* El Reporte Original del Alumno */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Reporte del Alumno (Folio {folio})
              </p>
              <p className="text-slate-700 italic font-serif text-lg leading-relaxed">
                "{ticket.content}"
              </p>
            </div>

            {/* Cuadro de Respuesta de la Autoridad */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">
                  Escriba la Resolución Oficial
                </label>
                <textarea 
                  name="responseText"
                  required
                  rows={6}
                  placeholder="Explique las acciones tomadas..."
                  className="w-full p-6 rounded-[2rem] border-2 border-slate-200 focus:border-emerald-500 outline-none shadow-inner resize-none text-slate-700 bg-white"
                />
              </div>

              {/* EL CLIP DE EVIDENCIA */}
              <div className="bg-slate-100 p-6 rounded-[2rem] border-2 border-dashed border-slate-300">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Adjuntar Comprobante de Resolución (Opcional)
                </label>
                <input 
                   name="evidence"
type="file"
multiple
                  className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Firmar y Resolver Caso"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-20">
             <p className="italic text-slate-400 animate-pulse">Localizando expediente...</p>
          </div>
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