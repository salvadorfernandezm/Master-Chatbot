export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import BuzonClient from "./BuzonClient";

export default async function PublicBuzonPage() {
  const settings = await prisma.settings.findFirst();
  const reglamentoReal = settings?.organizationBuzonInfo || "Reglamento pendiente.";

  return (
    <BuzonClient reglamento={reglamentoReal} />
  );
}