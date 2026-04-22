export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  // 1. OBTENER ESTADÍSTICAS REALES DE LA NUBE
  const [groupsCount, kbCount, chatbotsCount, docsCount] = await Promise.all([
    prisma.group.count(),
    prisma.knowledgeBase.count(),
    prisma.chatbot.count(),
    prisma.document.count(),
  ]);

  const stats = [
    { name: "Grupos", value: groupsCount, icon: "👥", color: "bg-blue-500", href: "/admin/groups" },
    { name: "Bases de Conocimiento", value: kbCount, icon: "📚", color: "bg-purple-500", href: "/admin/knowledge" },
    { name: "Chatbots Activos", value: chatbotsCount, icon: "🤖", color: "bg-emerald-500", href: "/admin/chatbots" },
    { name: "Documentos", value: docsCount, icon: "📄", color: "bg-orange-500", href: "/admin/knowledge" },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado con Estado de Conexión */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Monitor del Sistema</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Sincronizado con Supabase Cloud
          </p>
        </div>
        
        {/* BOTÓN DE RESPALDO (Placeholder funcional) */}
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                <span>💾</span> Descargar Respaldo JSON
            </button>
        </div>
      </div>

      {/* Rejilla de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} text-white text-xl shadow-inner`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-black text-slate-300 group-hover:text-slate-400 transition-colors uppercase tracking-widest">Ver detalles</span>
              </div>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{stat.name}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Sección de "Oro Molido" (Acceso rápido a Canvas/Instructure) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="text-xl font-bold mb-4">Integración con Canvas</h3>
            <p className="text-indigo-100 mb-6 leading-relaxed">
                Tu proyecto está listo para ser insertado en Instructure Canvas. 
                Recuerda que cada Chatbot tiene un token único que puedes usar como iframe.
            </p>
            <Link href="/admin/chatbots" className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all inline-block">
                Gestionar Tokens de Acceso
            </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Actividad Reciente</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-2xl">✨</span>
                    <div>
                        <p className="text-sm font-bold text-slate-700">Sistema Operativo</p>
                        <p className="text-xs text-slate-500 italic">Bienvenido, Salvador. Todo funciona correctamente.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}