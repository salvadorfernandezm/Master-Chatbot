export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import ChatClient from "./ChatClient";
import { notFound } from "next/navigation";

export default async function ChatServerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  console.log("=== CHAT REQUEST ===", { token });

  // Find the chatbot
  const chatbot = await prisma.chatbot.findUnique({
    where: { token: token.trim(), isActive: true },
    include: { group: true }
  });

  console.log("=== CHATBOT FOUND ===", !!chatbot);

  if (!chatbot) {
    notFound();
  }

  // Get Global settings for fallback
  const settings = await prisma.settings.findFirst();

  const orgName = settings?.organizationName || "Master Chatbot";
  const defaultWelcome = settings?.defaultWelcomeMessage || "¡Hola! ¿En qué puedo ayudarte hoy?";
  
  const finalWelcomeMessage = chatbot.welcomeMessage || defaultWelcome;
  const finalLogo = chatbot.logoUrl || settings?.organizationLogo;

  return (
    <ChatClient 
      token={token}
      name={chatbot.name}
      welcomeMessage={finalWelcomeMessage}
      inputPlaceholder={chatbot.inputPlaceholder || "Haz tu pregunta..."}
      logoUrl={finalLogo}
      orgName={orgName}
    />
  );
}
