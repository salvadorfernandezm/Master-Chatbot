export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function BuzonHubPage() {
  // Traemos los ajustes (Reglamento y Nombre)
  const settings = await prisma.settings.findFirst();
  
  // Traemos los últimos 3 reportes resueltos
  const latestResolved = await prisma.ticket.findMany({
    where: { status: "RESUELTO" },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });

  const actions = [
    {
      title: "Iniciar Reporte",
      desc: "Reporta de forma segura y anónima.",
      icon: "✍️",
      href: "/buzon/registro",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Seguimiento",
      desc: "¿Ya reportaste? Consulta tu estatus.",
      icon: "🔍",
      href: "/seguimiento",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Analíticas",
      desc: "Datos públicos del impacto del buzón.",
      icon: "📊",
      href: "/admin/analytics",
      color: "from-purple-500 to-purple-700",
    },
    {
      title: "Dirección",
      desc: "Acceso exclusivo para gestión.",
      icon: "🏛️",
      href: "/admin/directora",
      color: "from-slate-700 to-slate-900",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white font-sans flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            {settings?.organizationName || "Centro de Voz Ética"}
          </h1>
          <div className="h-1 w-24 bg-emerald-500 mx-auto rounded-full"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: REGLAMENTO VISIBLE DESDE EL INICIO */}
          <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] mb-4">📜 Reglamento del Buzón</h2>
            <div className="prose prose-invert prose-sm max-h-[400px] overflow-y-auto pr-4 custom-scrollbar text-slate-300 italic font-serif leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {settings?.organizationBuzonInfo || "Cargando reglamento..."}
              </ReactMarkdown>
            </div>
          </div>

          {/* COLUMNA DERECHA: BOTONES Y NOVEDADES */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
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
                      <span className="text-[9px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase">Resuelto</span>
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