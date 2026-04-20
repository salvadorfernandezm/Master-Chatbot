export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { createKnowledgeBase } from "@/app/actions/admin";
import { KnowledgeBaseList } from "@/components/KnowledgeBaseList";

export default async function KnowledgeBasesPage() {
  const kbs = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { documents: true, chatbots: true } } }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Bases de Conocimiento</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Nueva Base de Conocimiento</h2>
          <form action={createKnowledgeBase} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre (ej. Manuales APA)</label>
              <input name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Descripción</label>
              <textarea name="description" rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md">
              + Agregar Base
            </button>
          </form>
        </div>
        {/* Lista de Bases */}
        <div className="lg:col-span-2">
          <KnowledgeBaseList kbs={kbs as any} />
        </div>
      </div>
    </div>
  );
}
