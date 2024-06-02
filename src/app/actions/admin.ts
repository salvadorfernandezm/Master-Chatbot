export async function createTicket(formData: FormData): Promise<{ success: boolean; folio: string }> {
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;
  const studentName = formData.get("studentName") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const files = formData.getAll("evidence"); // Quitamos el tipo File[] para procesar manual

  if (!content || !type) return { success: false, folio: "" };
  const folio = `ETH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    const ticket = await prisma.ticket.create({
      data: {
        folio,
        type,
        category,
        content,
        studentName: studentName || "Anónimo Protegido",
        studentEmail: studentEmail || null,
        status: "PENDIENTE",
      },
    });

    if (supabase && files.length > 0) {
      for (const file of files) {
        const f = file as File;
        if (f.size > 0) {
          const fileExt = f.name.split('.').pop();
          const fileName = `student/${ticket.id}-${Date.now()}.${fileExt}`;
          
          // Convertimos el archivo a ArrayBuffer para asegurar compatibilidad total
          const arrayBuffer = await f.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from('evidencias')
            .upload(fileName, buffer, {
              contentType: f.type,
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            await prisma.attachment.create({
              data: { url: publicUrl, name: f.name, type: "STUDENT", ticketId: ticket.id }
            });
          } else {
            console.error("Error Supabase:", uploadError.message);
          }
        }
      }
    }

    revalidatePath("/admin/buzon");
    return { success: true, folio: ticket.folio };
  } catch (error) {
    console.error("Error crítico:", error);
    return { success: false, folio: "" };
  }
}