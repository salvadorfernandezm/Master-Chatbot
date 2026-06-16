"use client";
import { useState } from "react";
import { createChatbot } from "@/app/actions/buzonActions"; // Importación correcta

interface ChatbotFormWrapperProps {
  groups: { id: string; name: string }[];
  knowledgeBases: { id: string; name: string }[];
}

export default function ChatbotFormWrapper({ groups, knowledgeBases }: ChatbotFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit lg:sticky lg:top-24 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Nuevo Chatbot</h2>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="lg:hidden text-purple-600 font-bold text-sm"
        >
          {isOpen ? "✕ Cerrar" : "+ Crear"}
        </button>
      </div>

      {/* CAMBIO CLAVE: La acción ahora es createChatbot */}
      <form action={createChatbot} className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
        {/* 1. Nombre del Bot */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">
            Nombre del Chatbot
          </label>
          <input 
            name="name" 
            required 
            placeholder="Ej. Consultor APA 7"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm outline-none" 
          />
        </div>

        {/* 2. Asignar Grupo */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">
            Asignar a Grupo
          </label>
          <select 
            name="groupId" 
            required 
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-white outline-none"
          >
            <option value="">Selecciona un grupo...</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* 3. Base de Conocimiento */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">
            Fuente de Datos (IA)
          </label>
          <select 
            name="knowledgeBaseId" 
            required 
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm bg-white outline-none"
          >
            <option value="">Selecciona una base...</option>
            {knowledgeBases.map(kb => (
              <option key={kb.id} value={kb.id}>{kb.name}</option>
            ))}
          </select>
        </div>

        {/* --- PIEZA NUEVA: TOKEN DE RESCATE --- */}
        <div className="pt-2 border-t border-slate-50">
          <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 ml-1">
            🔑 Token de Rescate (Opcional)
          </label>
          <input 
            name="manualToken" 
            placeholder="Pega el código viejo aquí (ej: 7e149be5)" 
            className="w-full px-4 py-2 border border-amber-200 bg-amber-50/30 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm outline-none placeholder:text-amber-300" 
          />
          <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">
            * Usa esto para mantener el mismo link que ya tienen tus colegas.
          </p>
        </div>

        {/* Botón de envío */}
        <button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-100 transition-all active:scale-95 uppercase text-xs tracking-widest mt-2"
        >
          🚀 Lanzar Chatbot
        </button>
      </form>
    </div>
  );
}