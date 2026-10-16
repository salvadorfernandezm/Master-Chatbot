export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatPage({ params }: { params: { token: string } }) {
  try {
    // Buscamos el chatbot de forma directa
    const chatbot = await prisma.chatbot.findUnique({
      where: { token: params.token, isActive: true }
    });

    if (!chatbot) {
      return notFound();
    }

    const settings = await prisma.settings.findFirst();

    return (
      <ChatClient 
        token={chatbot.token}
        name={chatbot.name}
        welcomeMessage={chatbot.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?"}
        infoMessage={chatbot.infoMessage}
        inputPlaceholder={chatbot.inputPlaceholder || "Escribe un mensaje..."}
        logoUrl={chatbot.logoUrl}
        backgroundImageUrl={chatbot.backgroundImageUrl} // Aquí viaja la magia
        orgName={settings?.organizationName || "Institución"}
      />
    );
  } catch (error) {
    console.error("Error cargando el chat:", error);
    // Este error se verá en los logs de Vercel para darnos la pista final
    throw new Error("Fallo en el servidor del Agora");
  }
}