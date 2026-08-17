"use client";
import { useState } from "react";
import Link from "next/link";

export default function HubClient({ settings, latestResolved }: { settings: any, latestResolved: any[] }) {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center justify-center text-left text-left">
      <div className="max-w-5xl w-full">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            {settings?.organizationName || "Portal de Voz Ética"}
          </h1>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* PUERTA 1: REACTIVO (QUEJAS) */}
          <Link href="/buzon/registro" className="group">
            <div className="bg-slate-900 border-2 border-white/5 p-10 rounded-[3.5rem] hover:border-emerald-500/50 transition-all h-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform">⚖️</div>
              <h2 className="text-2xl font-black uppercase text-emerald-400 mb-4">Buzón de Sugerencias</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">Reporta fallos técnicos, inconformidades académicas o situaciones que requieran atención inmediata.</p>
              <span className="bg-emerald-600 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase">Iniciar Reporte</span>
            </div>
          </Link>

          {/* PUERTA 2: PROACTIVO (EXCELENCIA) */}
          <Link href="/excelencia" className="group">
            <div className="bg-slate-900 border-2 border-white/5 p-10 rounded-[3.5rem] hover:border-blue-500/50 transition-all h-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform">✨</div>
              <h2 className="text-2xl font-black uppercase text-blue-400 mb-4">Iniciativa de Excelencia</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">Propón ideas innovadoras para mejorar nuestra facultad. El Agente Socrático te ayudará a pulir tu visión.</p>
              <span className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase">Crear Propuesta</span>
            </div>
          </Link>
        </div>

        {/* ACCESOS DE GESTIÓN */}
        <div className="flex flex-wrap justify-center gap-4 border-t border-white/10 pt-10">
          <Link href="/seguimiento" className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">🔍 Seguimiento</Link>
          <Link href="/buzon/impacto" className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">📊 Analíticas</Link>
          <Link href="/admin/directora" className="bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border border-purple-500/30">🏛️ Dirección</Link>
          <Link href="/admin/posgrado" className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border border-indigo-500/30">🎓 Posgrado</Link>
        </div>

        {/* PIZARRA DISCRETA DE RESOLUCIONES */}
        {latestResolved && latestResolved.length > 0 && (
            <div className="mt-12 text-center">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Resoluciones Recientes</p>
                <div className="flex justify-center gap-2">
                    {latestResolved.map((r: any) => (
                        <div key={r.id} className="text-[9px] bg-white/5 border border-white/5 px-3 py-1 rounded-full text-slate-500">
                            Folio: {r.folio}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}