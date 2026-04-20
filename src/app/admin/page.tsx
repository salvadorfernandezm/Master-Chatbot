import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  // Datos reales de la base de datos
  const [groupsCount, kbsCount, botsCount, interactionsCount, recentInteractions] = await Promise.all([
    prisma.group.count(),
    prisma.knowledgeBase.count(),
    prisma.chatbot.count(),
    prisma.interaction.count(),
    prisma.interaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { chatbot: { select: { name: true } } }
    })
  ]);

  const stats = { groups: groupsCount, kbs: kbsCount, bots: botsCount, interactions: interactionsCount };

  const cards = [
    { title: "Grupos Activos", value: stats.groups, bg: "from-blue-600 to-cyan-500", icon: "👥", shadow: "shadow-blue-500/20" },
    { title: "Bases de Conocimiento", value: stats.kbs, bg: "from-purple-600 to-indigo-600", icon: "📚", shadow: "shadow-purple-500/20" },
    { title: "Chatbots Online", value: stats.bots, bg: "from-emerald-600 to-teal-500", icon: "🤖", shadow: "shadow-emerald-500/20" },
    { title: "Consultas Totales", value: stats.interactions, bg: "from-orange-600 to-rose-500", icon: "⚡", shadow: "shadow-orange-500/20" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Centro de Control</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Inteligencia en tiempo real de tus grupos y tutores IA.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Sistemas Operativos</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => (
          <div key={card.title} className={`group bg-white rounded-[2rem] p-8 shadow-xl ${card.shadow} border border-slate-100 flex flex-col gap-4 hover:-translate-y-2 transition-all duration-300`}>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl text-white bg-gradient-to-br ${card.bg} shadow-lg shadow-inherit rotate-3 group-hover:rotate-0 transition-transform`}>
              {card.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{card.title}</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Muro de Respuestas */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-purple-50 rounded-full blur-3xl opacity-50"></div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3 relative z-10">
            🧠 Muro de Actividad
            <span className="h-1 w-12 bg-purple-200 rounded-full"></span>
          </h2>
          <p className="text-xs text-slate-400 mb-6 relative z-10">Las últimas 5 preguntas que tus alumnos le hicieron a los tutores IA.</p>

          {recentInteractions.length === 0 ? (
            <div className="text-center text-slate-300 italic py-10 relative z-10">
              <p className="text-4xl mb-3">💬</p>
              <p>Aún no hay conversaciones registradas.</p>
              <p className="text-xs mt-1">Cuando los alumnos usen los chatbots, sus preguntas aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {recentInteractions.map((interaction) => (
                <div key={interaction.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-purple-100 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-purple-500 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      🤖 {interaction.chatbot.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(interaction.createdAt).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    <span className="text-slate-400 mr-1">❓</span>
                    {interaction.query.length > 120 ? interaction.query.slice(0, 120) + "…" : interaction.query}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    <span className="text-emerald-500 mr-1">✅</span>
                    {interaction.response.replace(/[*#`_]/g, "").slice(0, 180)}…
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 p-10 opacity-5 text-[12rem] font-black group-hover:scale-110 transition-transform">IA</div>
          <div className="relative z-10">
            <div className="inline-flex px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-500/30 mb-6">
              Cloud Gateway
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">Tu motor Gemini está listo.</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              El motor de búsqueda vectorial y los modelos Flash están sincronizados con tus bases de conocimiento.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-300">Gemini Flash · Activo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-300">Vector Store · {kbsCount} base(s) cargadas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-blue-300">Retry Shield · 3 reintentos automáticos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
