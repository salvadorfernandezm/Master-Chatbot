export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import ChatClient from "./ChatClient";
import { notFound } from "next/navigation";

export default async function ChatServerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const chatbot = await prisma.chatbot.findUnique({
    where: { token: token.trim(), isActive: true },
    select: {
      name: true,
      welcomeMessage: true,
      infoMessage: true, 
      inputPlaceholder: true,
      logoUrl: true
    }
  });

  if (!chatbot) notFound();

  // Buscamos los ajustes para traer el nombre y logo de la facultad
  const settings = await prisma.settings.findFirst();
  const orgName = settings?.organizationName || "Master Chatbot";
  const facultyLogo = settings?.organizationLogo;

  return (
    <ChatClient 
      token={token}
      name={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage || "¡Hola!"}
      infoMessage={chatbot.infoMessage} 
      inputPlaceholder={chatbot.inputPlaceholder || "Escribe aquí..."}
      logoUrl={chatbot.logoUrl || facultyLogo} // <-- Si el bot no tiene logo, usa el de la Facultad
      orgName={orgName}
    />
  );
}