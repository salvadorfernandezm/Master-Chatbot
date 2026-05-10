export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "@/components/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Buscamos los ajustes en la base de datos
  const settings = await prisma.settings.findFirst();

  // Nombres de columnas según tu base de datos actual
  const orgName = settings?.organizationName || "Master Chatbot";
  const orgLogo = settings?.organizationLogo;

  return (
    <AdminLayoutClient orgName={orgName} orgLogo={orgLogo}>
      {children}
    </AdminLayoutClient>
  );
}