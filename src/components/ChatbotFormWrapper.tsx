"use client";
import { useState } from "react";
import { createChatbot } from "@/app/actions/admin";

interface ChatbotFormWrapperProps {
  groups: { id: string; name: string }[];
  knowledgeBases: { id: string; name: string }[];
}

export default function ChatbotFormWrapper({ groups, knowledgeBases }: ChatbotFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit lg:sticky lg:top-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700">Nuevo Chatbot</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-purple-600 font-bold text-sm">
          {isOpen ? "✕ Cerrar" : "+ Nuevo"}
        </button>
      </div>
      <form action={createChatbot} className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
          <input name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Asignar Grupo</label>
          <select name="groupId" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-white">
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Base de Conocimiento</label>
          <select name="knowledgeBaseId" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-white">
            {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-md text-sm">+ Lanzar Chatbot</button>
      </form>
    </div>
  );
}