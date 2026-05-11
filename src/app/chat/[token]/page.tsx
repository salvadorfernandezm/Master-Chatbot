export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import ChatClient from "./ChatClient";
import { notFound } from "next/navigation";

export default async function ChatServerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // BUSCAMOS LOS DATOS, INCLUYENDO EL INFO MESSAGE
  const chatbot = await prisma.chatbot.findUnique({
    where: { token: token.trim(), isActive: true },
    select: {
      name: true,
      welcomeMessage: true,
      infoMessage: true, // <-- ESTO ES VITAL
      inputPlaceholder: true,
      logoUrl: true
    }
  });

  if (!chatbot) notFound();

  const settings = await prisma.settings.findFirst();
  const orgName = settings?.organizationName || "Master Chatbot";

  return (
    <ChatClient 
      token={token}
      name={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage || "¡Hola!"}
      infoMessage={chatbot.infoMessage} // <-- AQUÍ SE MANDA A LA VARITA MÁGICA
      inputPlaceholder={chatbot.inputPlaceholder || "Escribe aquí..."}
      logoUrl={chatbot.logoUrl || settings?.organizationLogo}
      orgName={orgName}
    />
  );
}