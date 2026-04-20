import { prisma } from "@/lib/prisma";
import { GroupList, CreateGroupForm } from "@/components/GroupList";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { chatbots: true } } }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Grupos de Alumnos</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <CreateGroupForm />
        <div className="lg:col-span-2">
          <GroupList groups={groups as any} />
        </div>
      </div>
    </div>
  );
}
