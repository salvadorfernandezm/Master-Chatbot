export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { GroupList } from "@/components/GroupList";
import GroupFormWrapper from "@/components/GroupFormWrapper";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { chatbots: true } } }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div><GroupFormWrapper /></div>
      <div className="lg:col-span-2"><GroupList groups={groups as any} /></div>
    </div>
  );
}