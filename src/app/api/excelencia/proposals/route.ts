import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  // Solo traemos las propuestas que el administrador ya marcó como APROBADA
  const data = await prisma.proposal.findMany({ 
    where: { status: "APROBADA" },
    orderBy: { votes: 'desc' } 
  });
  return NextResponse.json(data);
}