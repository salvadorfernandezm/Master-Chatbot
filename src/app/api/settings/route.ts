export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        organizationName: true,
        organizationLogo: true,
        organizationBuzonInfo: true, // Tu reglamento vive aquí
      }
    });
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}