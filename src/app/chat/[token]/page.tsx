export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  try {
    const chatbot = await prisma.chatbot.findUnique({
      where: { token: token, isActive: true }
    });

    if (!chatbot) return notFound();

    const settings = await prisma.settings.findFirst();

    return (
      <ChatClient 
        token={chatbot.token}
        name={chatbot.name}
        welcomeMessage={chatbot.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?"}
        infoMessage={chatbot.infoMessage}
        inputPlaceholder={chatbot.inputPlaceholder || "Escribe un mensaje..."}
        logoUrl={chatbot.logoUrl}
        backgroundImageUrl={chatbot.backgroundImageUrl}
        bgPositionMobile={chatbot.bgPositionMobile} // <--- PASAMOS EL VALOR
        bgPositionDesktop={chatbot.bgPositionDesktop} // <--- PASAMOS EL VALOR
        bgPosXMobile={chatbot.bgPosXMobile}
bgPosXDesktop={chatbot.bgPosXDesktop}
orgName={settings?.organizationName || "Institución"}
      />
    );
  } catch (error: any) {
    console.error("DETALLE TÉCNICO DEL FALLO:", error.message);
    throw new Error(`Error en el búnker: ${error.message}`);
  }
}