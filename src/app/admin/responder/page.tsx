"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitAuthorityResponse } from "@/app/actions/admin";

function ResponderForm() {
  const searchParams = useSearchParams();
  const folio = searchParams.get("folio");

  const [ticket, setTicket] = useState<any>(null);
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS">("IDLE");

  // Buscamos los datos del ticket para que la autoridad sepa qué está contestando
  useEffect(() => {
    if (folio) {
      fetch(`/api/seguimiento?folio=${folio}`)
        .then(res => res.json())
        .then(data => setTicket(data));
    }
  }, [folio]);

  const handleEnviar = async () => {
    if (!respuesta.trim() || !ticket) return;
    setLoading(true);
    const res = await submitAuthorityResponse(ticket.id || folio, respuesta);
    if (res.success) setStatus("SUCCESS");
    setLoading(false);
  };

  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6">🏛️</div>
          <h1 className="text-2xl font-black uppercase mb-4">Respuesta Enviada</h1>
          <p className="text-slate-400 italic">"La gestión de calidad se fortalece con su atención. El alumno ha sido notificado."</p>
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
          <div className="space-y-8">
            {/* El Reporte Original */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Reporte del Alumno (Folio {folio})</p>
              <p className="text-slate-700 italic font-serif text-lg">"{ticket.content}"</p>
            </div>

            {/* Cuadro de Respuesta */}
            // Dentro de la sección del Cuadro de Respuesta:
<div className="space-y-4">
  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">Escriba la Resolución Oficial</label>
  <textarea 
    name="responseText" // Cambiamos a name para usar FormData
    required
    rows={6}
    className="w-full p-6 rounded-[2rem] border-2 border-slate-200 focus:border-emerald-500 outline-none shadow-inner resize-none text-slate-700"
    placeholder="Describa las acciones tomadas..."
  />
  
  {/* EL CLIP DE EVIDENCIA PARA LA AUTORIDAD */}
  <div className="bg-slate-100 p-4 rounded-2xl border-2 border-dashed border-slate-300">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Adjuntar comprobante (Foto/Video/PDF)</label>
    <input 
      type="file" 
      name="evidence"
      className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500 file:text-white"
    />
  </div>

  <button 
    type="submit" // Cambiado a submit para el formulario
    className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all uppercase tracking-widest"
  >
    Firmar y Resolver Caso
  </button>
</div>

export default function ResponderPage() {
  return (
    <Suspense fallback={<div>Cargando Despacho...</div>}>
      <ResponderForm />
    </Suspense>
  );
}