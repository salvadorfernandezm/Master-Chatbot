export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import { KnowledgeBaseList } from "@/components/KnowledgeBaseList";
import KnowledgeBaseFormWrapper from "@/components/KnowledgeBaseFormWrapper";

export default async function KnowledgeBasesPage() {
  const kbs = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { documents: true, chatbots: true } } }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestión de Conocimiento</h1>
        <p className="text-slate-500 text-sm">Organiza los archivos y fuentes de tus tutores IA.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario que ahora es inteligente en móvil */}
        <div>
          <KnowledgeBaseFormWrapper />
        </div>
        
        {/* Lista de Bases */}
        <div className="lg:col-span-2">
          <KnowledgeBaseList kbs={kbs as any} />
        </div>
      </div>
    </div>
  );
}