import { prisma } from "@/lib/prisma";
import { createChatbot, deleteChatbot } from "@/app/actions/admin";
import { ChatbotList } from "@/components/ChatbotList";

export default async function ChatbotsPage() {
  const [chatbots, groups, kbs] = await Promise.all([
    prisma.chatbot.findMany({
      orderBy: { createdAt: 'desc' },
      include: { group: true, knowledgeBase: true }
    }),
    prisma.group.findMany(),
    prisma.knowledgeBase.findMany()
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Generador de Chatbots</h1>
        <p className="text-slate-400 text-sm italic">Ensambla y personaliza la personalidad de tus tutores IA</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Ensamblar Nuevo Chatbot</h2>
          <form action={createChatbot} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre (Alias)</label>
              <input 
                name="name" 
                required 
                placeholder="Ej. Asistente APA Grupo 1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Grupo al que atiende</label>
                <select name="groupId" required className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 text-sm">
                  <option value="">Selecciona un Grupo</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Base de Conocimiento asociada</label>
                <select name="knowledgeBaseId" required className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 text-sm">
                  <option value="">Selecciona una Base</option>
                  {kbs.map(kb => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={groups.length === 0 || kbs.length === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed mt-2">
              {groups.length === 0 || kbs.length === 0 ? "Faltan Grupos o Bases" : "+ Generar Chatbot Enlace"}
            </button>
          </form>
        </div>

        {/* Lista de Chatbots Activos */}
        <div className="xl:col-span-2">
          <ChatbotList chatbots={chatbots as any} />
        </div>
      </div>
    </div>
  );
}
