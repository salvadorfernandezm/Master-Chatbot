export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatPage({ params }: { params: { token: string } }) {
  const chatbot = await prisma.chatbot.findUnique({
    where: { token: params.token, isActive: true },
    include: { group: true }
  });

  if (!chatbot) notFound();

  const settings = await prisma.settings.findFirst();

  return (
    <ChatClient 
      token={chatbot.token}
      name={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?"}
      infoMessage={chatbot.infoMessage}
      inputPlaceholder={chatbot.inputPlaceholder || "Escribe un mensaje..."}
      logoUrl={chatbot.logoUrl}
      backgroundImageUrl={chatbot.backgroundImageUrl} // <--- PASAMOS EL FONDO
      orgName={settings?.organizationName || "Institución"}
    />
  );
}