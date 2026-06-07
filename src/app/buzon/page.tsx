"use client";

import Link from "next/link";

export default async function BuzonHubPage() {
  // Traemos los últimos 3 tickets resueltos
  const latestResolved = await prisma.ticket.findMany({
    where: { status: "RESUELTO" },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });
  
const actions = [
    {
      title: "Enviar Sugerencia o Reporte",
      desc: "Tu voz es el motor del cambio. Reporta de forma segura y anónima.",
      icon: "✍️",
      href: "/buzon/registro", // Crearemos esta carpeta ahora
      color: "from-emerald-500 to-teal-600",
      btnText: "Iniciar Reporte"
    },
    {
      title: "Seguimiento de Folio",
      desc: "¿Ya reportaste? Consulta aquí qué ha respondido la autoridad.",
      icon: "🔍",
      href: "/seguimiento",
      color: "from-blue-500 to-indigo-600",
      btnText: "Ver mi Estatus"
    },
    {
      title: "Analíticas Públicas",
      desc: "Transparencia total: Gráficas y datos del impacto del buzón.",
      icon: "📊",
      href: "/admin/analytics", // Luego haremos una versión pública si quieres
      color: "from-purple-500 to-purple-700",
      btnText: "Estamos procesando los primeros datos para garantizar transparencia total"
    },
    {
      title: "Portal de Gestión (Directora)",
      desc: "Acceso exclusivo para la revisión y resolución de casos.",
      icon: "🏛️",
       href: "/admin/directora",
      color: "from-slate-700 to-slate-900",
      btnText: "Entrar a Gestión"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full">
        <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-5xl font-black uppercase tracking-[0.2em] mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            Centro de Voz Ética
          </h1>
          <p className="text-slate-400 italic text-lg max-w-2xl mx-auto leading-relaxed">
            "Donde los que no tenían vez, hoy son escuchados. Un compromiso con la excelencia de nuestra Facultad."
          </p>
 {latestResolved.length > 0 && (
    <div className="mt-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 text-center">
        🔔 Actividad Reciente
      </p>
      <div className="space-y-2">
        {latestResolved.map((t) => (
          <div key={t.id} className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-2xl flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <span className="text-xs font-bold text-slate-300">Folio: {t.folio}</span>
            </div>
            <span className="text-[9px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase">
              Resuelto - ¡Verifica!
            </span>
          </div>
        ))}
      </div>
    </div>
  )}

          <div className="h-1 w-32 bg-emerald-500 mx-auto mt-6 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {actions.map((action, index) => (
            <div 
              key={index}
              className="bg-slate-900/50 border border-white/10 rounded-[3rem] p-8 hover:border-emerald-500/50 transition-all duration-500 group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="flex items-start gap-6">
                <div className="text-5xl">{action.icon}</div>
                <div className="space-y-3">
                  <h2 className="text-xl font-black uppercase tracking-tight text-emerald-50">{action.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{action.desc}</p>
                  <Link 
                    href={action.href}
                    className={`inline-block mt-4 px-6 py-2 bg-gradient-to-r ${action.color} rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                  >
                    {action.btnText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-20 text-center border-t border-white/5 pt-8">
            <button className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.3em] hover:text-emerald-500 transition-colors">
               Sistema de Gestión Universitaria • Durango 2026
            </button>
        </footer>
      </div>
    </div>
  );
}