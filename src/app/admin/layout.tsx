export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "@/components/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findFirst();
  const orgName = settings?.organizationName || "Master Chatbot IA";
  const orgLogo = settings?.organizationLogo;

  return (
    <AdminLayoutClient orgName={orgName} orgLogo={orgLogo}>
      {children}
    </AdminLayoutClient>
  );
}
