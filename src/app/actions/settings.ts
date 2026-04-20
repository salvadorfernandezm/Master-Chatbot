"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGlobalSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        organizationName: "Master Chatbot IA",
        defaultWelcomeMessage: "¡Hola! Soy el asistente del profesor y estoy aquí para ayudarte."
      }
    });
  }
  return settings;
}

export async function updateGlobalSettings(formData: FormData) {
  const organizationName = formData.get("organizationName") as string;
  const defaultWelcomeMessage = formData.get("defaultWelcomeMessage") as string;

  const settings = await getGlobalSettings();

  await prisma.settings.update({
    where: { id: settings.id },
    data: {
      organizationName,
      defaultWelcomeMessage
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/chat"); // Revalidate all chats
}
