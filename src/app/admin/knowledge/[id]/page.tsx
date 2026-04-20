import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { uploadFileDocument, addUrlDocument, deleteDocument } from "@/app/actions/admin";
import Link from "next/link";
import { UploadDocumentForm, AddUrlForm } from "@/components/KnowledgeForms";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const kb = await prisma.knowledgeBase.findUnique({
    where: { id },
    include: { 
      documents: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } }
      }
    }
  });

  if (!kb) notFound();
  const knowledgeBase = kb as any;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/knowledge" className="bg-white border border-slate-200 p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{knowledgeBase.name}</h1>
          <p className="text-slate-500 font-medium">Gestionar documentos y fuentes de conocimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Carga */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-sm italic">PDF</span>
              Subir Documento (PDF/Word)
            </h2>
            <UploadDocumentForm action={uploadFileDocument} knowledgeBaseId={id} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 font-medium">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">URL</span>
              Agregar Enlace (Página Web)
            </h2>
            <AddUrlForm action={addUrlDocument} knowledgeBaseId={id} />
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 italic lowercase tracking-tight">Documentos en esta Base</h2>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{knowledgeBase.documents.length} archivos</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {knowledgeBase.documents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Aún no has cargado conocimiento aquí.
                </div>
              ) : (
                knowledgeBase.documents.map((doc: any) => (
                  <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : doc.type === 'WORD' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                        {doc.type === 'PDF' ? '📄' : doc.type === 'WORD' ? '📝' : '🔗'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 max-w-sm truncate" title={doc.filename}>{doc.filename}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5 font-bold">
                          {doc.type} • {doc._count.chunks} fragmentos indexados
                        </p>
                      </div>
                    </div>
                    
                    <form action={async () => {
                      "use server";
                      await deleteDocument(doc.id, id);
                    }}>
                      <button type="submit" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
