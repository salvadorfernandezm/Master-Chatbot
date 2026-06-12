"use client";

import { useState, useEffect } from "react";
import { createTicket } from "@/app/actions/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

export default function BuzonPublico() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [folio, setFolio] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Error cargando configuración:", err);
      }
    }
    fetchSettings();
  }, []);

  async function handleSubmit(formData: FormData) {
    setStatus("idle");
    const result = await createTicket(formData);
    if (result && result.success) {
      setFolio(result.folio);
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-2xl font-black uppercase mb-4">Reporte Recibido</h1>
          <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8">
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2">Tu Folio de Seguimiento</p>
            <p className="text-5xl font-black text-white">{folio}</p>
          </div>
          <Link href="/buzon" onClick={() => setStatus("idle")} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl font-bold transition-all">
            Enviar otro reporte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-widest text-emerald-500">Sistema de Voz Ética</h1>
          <p className="text-slate-400 italic mt-2">Tu identidad está protegida.</p>
        </header>

        <form action={handleSubmit} className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/5 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-2">Categoría</label>
              <select name="type" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500">
                <option value="ACADEMICA">Asunto Académico</option>
                <option value="LOGISTICA">Instalaciones / Logística</option>
                <option value="GRAVE">Situación Grave / Ética</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="studentEmail" type="email" placeholder="Correo (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500" />
              <input name="studentName" type="text" placeholder="Nombre (Opcional)" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500" />
            </div>

            <textarea name="content" required rows={5} placeholder="Describe los hechos..." className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500 resize-none"></textarea>
            
            <input name="evidence" type="file" multiple className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-500 file:text-black font-bold cursor-pointer" />
          </div>

          <button type="submit" className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2rem] uppercase hover:bg-white transition-all">
            Enviar Reporte
          </button>
        </form>
      </div>
    </div>
  );
}