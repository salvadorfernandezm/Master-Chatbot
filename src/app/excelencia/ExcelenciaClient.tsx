"use client";
import { useState } from "react";
import Link from "next/link";
import SocraticChat from "./SocraticChat";

export default function ExcelenciaClient({ settings }: { settings: any }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left">
      <nav className="bg-white border-b border-slate-200 py-6 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">✨</div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Iniciativa de Excelencia</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{settings?.organizationName}</p>
          </div>
        </div>
        <Link href="/buzon" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-all uppercase">← Volver</Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        {!showChat ? (
          <div className="animate-in fade-in duration-700">
            <header className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
                La <span className="text-emerald-600 italic">Cura</span> de la <br/>Facultad.
              </h2>
              {/* PUNTO 3: AVISO DE DESLINDE LEGAL */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-3xl mb-8">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">⚖️ Nota de Viabilidad</p>
                <p className="text-xs text-blue-800 leading-relaxed italic">
                  "Las propuestas y sus respaldos son un motor de opinión estudiantil. Su ejecución final dependerá exclusivamente de la valoración técnica, presupuestal y normativa de las autoridades competentes."
                </p>
              </div>
              <p className="text-xl text-slate-500 font-serif italic leading-relaxed max-w-2xl">
                "Cuidar nuestra facultad es ponerle corazón. Tus ideas son el pulso de la excelencia."
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100"><div className="text-4xl mb-4">🎓</div><h3 className="text-xl font-black uppercase mb-2">Académica</h3><p className="text-sm text-slate-500">Planes de estudio y docencia.</p></div>
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100"><div className="text-4xl mb-4">🏛️</div><h3 className="text-xl font-black uppercase mb-2">Logística</h3><p className="text-sm text-slate-500">Espacios y servicios.</p></div>
            </div>

            <section className="bg-slate-900 rounded-[4rem] p-12 text-white text-center relative overflow-hidden shadow-2xl">
              <h3 className="text-3xl font-black uppercase mb-4">¿Tienes una idea?</h3>
              <p className="text-slate-400 mb-10 max-w-lg mx-auto text-center">Sócrates te ayudará a pulirla antes de publicarla.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setShowChat(true)} className="bg-emerald-500 hover:bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all">Iniciar Propuesta</button>
                <Link href="/excelencia/mural" className="bg-slate-800 text-white border-2 border-white/10 px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all">Ver Mural</Link>
              </div>
            </section>
          </div>
        ) : (
          <SocraticChat />
        )}
      </main>
    </div>
  );
}