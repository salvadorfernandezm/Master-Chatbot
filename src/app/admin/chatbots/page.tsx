export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { ChatbotList } from "@/components/ChatbotList";
import ChatbotFormWrapper from "@/components/ChatbotFormWrapper";

export default async function ChatbotsPage() {
  const [chatbots, groups, kbs] = await Promise.all([
    prisma.chatbot.findMany({ 
      orderBy: [
        { isActive: 'desc' }, // Primero los En Línea (true)
        { name: 'asc' }       // Luego por orden alfabético
      ],
      include: { group: true, knowledgeBase: true } 
    }),
    prisma.group.findMany(),
    prisma.knowledgeBase.findMany()
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna del formulario para crear nuevos */}
      <div>
        <ChatbotFormWrapper groups={groups} knowledgeBases={kbs} />
      </div>

      {/* Columna de la lista para gestionar y editar los existentes */}
      <div className="lg:col-span-2">
        <ChatbotList 
          chatbots={chatbots as any} 
          groups={groups} 
          knowledgeBases={kbs} 
        />
      </div>
    </div>
  );
}