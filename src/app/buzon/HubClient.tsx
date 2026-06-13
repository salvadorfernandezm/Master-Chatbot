"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HubClient({ settings, latestResolved }: { settings: any, latestResolved: any[] }) {
  const [accepted, setAccepted] = useState(false);

  const actions = [
    {
      title: "Iniciar Reporte",
      desc: "Reporta de forma segura y anónima.",
      icon: "✍️",
      href: "/buzon/registro",
    },
    {
      title: "Seguimiento",
      desc: "¿Ya reportaste? Consulta tu estatus.",
      icon: "🔍",
      href: "/seguimiento",
    },
    {
      title: "Analíticas",
      desc: "Datos públicos de impacto.",
      icon: "📊",
      href: "/admin/analytics",
    },
    {
      title: "Dirección",
      desc: "Acceso exclusivo de gestión.",
      icon: "🏛️",
      href: "/admin/directora",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            {settings?.organizationName || "Centro de Voz Ética"}
          </h1>
          <div className="h-1 w-24 bg-emerald-500 mx-auto rounded-full"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: REGLAMENTO + PALOMITA */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] mb-4">📜 Reglamento del Buzón</h2>
              <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto pr-4 custom-scrollbar text-slate-300 italic font-serif leading-relaxed mb-6 text-left">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {settings?.organizationBuzonInfo || "Cargando reglamento..."}
                </ReactMarkdown>
              </div>
              
              <label className="flex items-center gap-4 cursor-pointer group bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/10 transition-all">
                <input 
                  type="checkbox" 
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="w-7 h-7 rounded-lg border-2 border-emerald-500 bg-transparent checked:bg-emerald-500 transition-all cursor-pointer"
                />
                <span className="text-sm font-bold text-emerald-50 text-left">He leído el reglamento y manifiesto mi conformidad.</span>
              </label>
            </div>
          </div>

          {/* COLUMNA DERECHA: BOTONES Y NOVEDADES */}
          <div className="space-y-8 text-left">
            <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ${accepted ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
              {actions.map((action, index) => (
                <Link key={index} href={action.href} className="group">
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl hover:border-emerald-500/50 transition-all h-full shadow-lg hover:-translate-y-1">
                    <div className="text-3xl mb-3">{action.icon}</div>
                    <h3 className="text-sm font-black uppercase text-emerald-50 group-hover:text-emerald-400 transition-colors">{action.title}</h3>
                  </div>
                </Link>
              ))}
            </div>

            {/* PIZARRA DE NOVEDADES */}
            {latestResolved.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2.5rem]">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">🔔 Resoluciones Recientes</p>
                <div className="space-y-2">
                  {latestResolved.map((t) => (
                    <div key={t.id} className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-slate-400">Folio: {t.folio}</span>
                      <span className="text-[9px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase text-center">Resuelto</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}