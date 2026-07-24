import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  const data = await prisma.proposal.findMany({ orderBy: { votes: 'desc' } });
  return NextResponse.json(data);
}