export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { ChatbotList } from "@/components/ChatbotList";
import ChatbotFormWrapper from "@/components/ChatbotFormWrapper";

export default async function ChatbotsPage() {
  const [chatbots, groups, kbs] = await Promise.all([
    prisma.chatbot.findMany({ include: { group: true, knowledgeBase: true } }),
    prisma.group.findMany(),
    prisma.knowledgeBase.findMany()
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div><ChatbotFormWrapper groups={groups} knowledgeBases={kbs} /></div>
      <div className="lg:col-span-2"><ChatbotList chatbots={chatbots as any} /></div>
    </div>
  );
}