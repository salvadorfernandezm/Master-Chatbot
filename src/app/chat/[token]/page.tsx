export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import ChatClient from "./ChatClient";
import { notFound } from "next/navigation";

export default async function ChatServerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Recogemos el chatbot y su nuevo mensaje de info
  const chatbot = await prisma.chatbot.findUnique({
    where: { token: token.trim(), isActive: true },
    select: {
      name: true,
      welcomeMessage: true,
      infoMessage: true, // <--- IMPORTANTE
      inputPlaceholder: true,
      logoUrl: true
    }
  });

  if (!chatbot) notFound();

  // Ajustes institucionales para el nombre de la organización
  const settings = await prisma.settings.findFirst();
  const orgName = settings?.organizationName || "Sistema Académico";

  return (
    <ChatClient 
      token={token}
      name={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage || "¡Hola!"}
      infoMessage={chatbot.infoMessage} // <--- Pasamos la vara mágica
      inputPlaceholder={chatbot.inputPlaceholder || "Escribe aquí..."}
      logoUrl={chatbot.logoUrl || settings?.organizationLogo}
      orgName={orgName}
    />
  );
}