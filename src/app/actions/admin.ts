// (Busca la función updateChatbot en admin.ts y reemplázala por esta)
export async function updateChatbot(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const updateData: any = {};
  
  // Mapeo estricto para evitar cruces
  if (formData.has("name")) updateData.name = formData.get("name") as string;
  if (formData.has("welcomeMessage")) updateData.welcomeMessage = formData.get("welcomeMessage") as string;
  if (formData.has("infoMessage")) updateData.infoMessage = formData.get("infoMessage") as string;
  if (formData.has("inputPlaceholder")) updateData.inputPlaceholder = formData.get("inputPlaceholder") as string;
  if (formData.has("systemInstructions")) updateData.systemInstructions = formData.get("systemInstructions") as string;

  const isActiveStr = formData.get("isActive");
  if (isActiveStr !== null) {
    updateData.isActive = isActiveStr === "true";
  }

  await prisma.chatbot.update({ where: { id }, data: updateData });
  revalidatePath("/admin/chatbots");
}