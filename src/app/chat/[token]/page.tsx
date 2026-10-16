export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatPage({ params }: { params: any }) {
  // 1. Extraemos el token esperando a que los parámetros estén listos
  // Esto es vital en las versiones más nuevas de Next.js
  const resolvedParams = await params;
  const token = resolvedParams.token;

  try {
    // 2. Buscamos el chatbot
    const chatbot = await prisma.chatbot.findUnique({
      where: { token: token, isActive: true }
    });

    if (!chatbot) {
      console.error("Chatbot no encontrado con token:", token);
      return notFound();
    }

    // 3. Buscamos la configuración global
    const settings = await prisma.settings.findFirst();

    // 4. Enviamos los datos al cliente (el navegador)
    return (
      <ChatClient 
        token={chatbot.token}
        name={chatbot.name}
        welcomeMessage={chatbot.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?"}
        infoMessage={chatbot.infoMessage}
        inputPlaceholder={chatbot.inputPlaceholder || "Escribe un mensaje..."}
        logoUrl={chatbot.logoUrl}
        backgroundImageUrl={chatbot.backgroundImageUrl}
        orgName={settings?.organizationName || "Institución"}
      />
    );
  } catch (error: any) {
    // ESTO ES PARA EL TAQUÍGRAFO: El error real saldrá en los logs de Vercel
    console.error("DETALLE TÉCNICO DEL FALLO:", error.message);
    throw new Error(`Error en el búnker: ${error.message}`);
  }
}