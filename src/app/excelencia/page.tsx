export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import ExcelenciaClient from "./ExcelenciaClient";

export default async function ExcelenciaPage() {
  const settings = await prisma.settings.findFirst();

  return (
    <ExcelenciaClient settings={settings} />
  );
}