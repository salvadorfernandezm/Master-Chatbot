"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExcelenciaClient({ settings }: { settings: any }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER DE LA INICIATIVA */}
      <nav className="bg-white border-b border-slate-200 py-6 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200">
            ✨
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Iniciativa de Excelencia</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{settings?.organizationName}</p>
          </div>
        </div>
        <Link href="/buzon" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-all uppercase">← Volver</Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12 text-left">
        {/* HERO SECTION */}
        <header className="mb-16">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
            La <span className="text-emerald-600 italic">Cura</span> de la <br/>Facultad.
          </h2>
          <p className="text-xl text-slate-500 font-serif italic leading-relaxed max-w-2xl">
            "Porque cuidar nuestra facultad es ponerle corazón. Tus propuestas son el pulso de la excelencia académica que buscamos construir juntos."
          </p>
          <div className="h-1.5 w-24 bg-emerald-500 mt-8 rounded-full"></div>
        </header>

        {/* CARTAS DE CATEGORÍAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">🎓</div>
            <h3 className="text-xl font-black uppercase mb-2">Excelencia Académica</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Propuestas para mejorar planes de estudio, bibliografía, tutorías o dinámicas en el aula.</p>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">🏛️</div>
            <h3 className="text-xl font-black uppercase mb-2">Logística e Innovación</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Ideas para optimizar espacios, tecnología y servicios que faciliten la vida universitaria.</p>
          </div>
        </div>

        {/* ACCIÓN PRINCIPAL */}
        <section className="bg-slate-900 rounded-[4rem] p-12 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">💡</div>
          <h3 className="text-3xl font-black uppercase mb-4 tracking-tight">¿Tienes una gran idea?</h3>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Nuestro Agente Socrático te ayudará a pulir tu propuesta antes de presentarla a la comunidad. ¡Hagamos que suceda!
          </p>
          <button 
            onClick={() => alert("Próximo paso: El Agente Socrático")}
            className="bg-emerald-500 hover:bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            Iniciar Propuesta
          </button>
        </section>

        {/* PIE DE PÁGINA */}
        <footer className="mt-20 border-t border-slate-200 pt-10 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Decir no a la indiferencia hace la diferencia</p>
        </footer>
      </main>
    </div>
  );
}