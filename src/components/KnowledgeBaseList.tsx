"use client";

import { useState } from "react";
import { deleteKnowledgeBase, updateKnowledgeBase } from "@/app/actions/admin";
import Link from "next/link";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  _count: { documents: number; chatbots: number };
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function KBCard({ kb }: { kb: KnowledgeBase }) {
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la base "${kb.name}"?\n⚠️ Esto eliminará todos los documentos y los ${kb._count.chatbots} chatbot(s) que la usan.`)) return;
    await deleteKnowledgeBase(kb.id);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {!editing ? (
        <div className="p-6 flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-lg">{kb.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{kb.description || <span className="italic text-slate-300">Sin descripción</span>}</p>
            <div className="mt-3 flex gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1">📄 {kb._count.documents} documentos</span>
              <span className="flex items-center gap-1">🤖 {kb._count.chatbots} chatbots anclados</span>
            </div>
            <div className="mt-4">
              <Link href={`/admin/knowledge/${kb.id}`} className="text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center gap-1 w-fit">
                Gestionar Documentos →
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button onClick={() => setEditing(true)} title="Editar base" className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
              <PencilIcon />
            </button>
            <button onClick={handleDelete} title="Eliminar base" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-purple-50/50 border-t-2 border-purple-200">
          <p className="text-xs font-black text-purple-500 uppercase tracking-widest mb-4">✏️ Editando Base de Conocimiento</p>
          <form action={updateKnowledgeBase} onSubmit={() => setEditing(false)} className="space-y-3">
            <input type="hidden" name="id" value={kb.id} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
              <input name="name" defaultValue={kb.name} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
              <textarea name="description" defaultValue={kb.description || ""} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl transition-all text-sm">Guardar Cambios</button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm hover:bg-slate-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function KnowledgeBaseList({ kbs }: { kbs: KnowledgeBase[] }) {
  if (kbs.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        No hay bases de conocimiento registradas todavía.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {kbs.map(kb => <KBCard key={kb.id} kb={kb} />)}
    </div>
  );
}
