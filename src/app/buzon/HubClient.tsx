"use client";

import Link from "next/link";

export default function HubClient({ settings, latestResolved }: { settings: any, latestResolved: any[] }) {
  const actions = [
    { title: "Iniciar Reporte", desc: "Reporta de forma segura.", icon: "✍️", href: "/buzon/registro", color: "bg-emerald-500" },
    { title: "Seguimiento", desc: "¿Ya reportaste?", icon: "🔍", href: "/seguimiento", color: "bg-blue-500" },
   {
  title: "Analíticas",
  desc: "Datos públicos de impacto.",
  icon: "📊",
  href: "/buzon/impacto", // <-- CAMBIAR ESTA LÍNEA
},
    { title: "Dirección", desc: "Acceso exclusivo.", icon: "🏛️", href: "/admin/directora", color: "bg-slate-700" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center justify-center text-left">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            {settings?.organizationName || "Centro de Voz Ética"}
          </h1>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {actions.map((action, index) => (
            <Link key={index} href={action.href} className="group">
              <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] hover:border-emerald-500/50 transition-all h-full shadow-2xl flex items-center gap-6">
                <div className={`text-4xl p-4 rounded-3xl ${action.color} bg-opacity-20`}>{action.icon}</div>
                <div>
                  <h3 className="text-lg font-black uppercase text-emerald-50 group-hover:text-emerald-400 transition-colors">{action.title}</h3>
                  <p className="text-slate-400 text-xs">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {latestResolved.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[3rem]">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 text-center">🔔 Resoluciones Recientes</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {latestResolved.map((t) => (
                <div key={t.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Folio: {t.folio}</span>
                  <span className="text-[9px] font-black bg-emerald-500 text-black px-3 py-1 rounded-full uppercase">Resuelto</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}