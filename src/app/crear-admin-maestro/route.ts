import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const passwordHash = await bcrypt.hash("Salvador123", 10);

    // 1. Crear o actualizar Ajustes (Para matar el Error 500)
    await prisma.settings.upsert({
      where: { id: "default-settings" },
      update: {},
      create: {
        id: "default-settings",
        organizationName: "Ecosistema Salvador",
        defaultWelcomeMessage: "¡Bienvenido al sistema!"
      }
    });

    // 2. Crear o actualizar Usuario
    await prisma.user.upsert({
      where: { email: "admin@admin.com" },
      update: { password: passwordHash },
      create: {
        email: "admin@admin.com",
        name: "Salvador",
        password: passwordHash,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}