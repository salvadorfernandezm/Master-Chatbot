"use client";
import { useState } from "react";
import { createKnowledgeGroup } from "@/app/actions/admin";

export default function KnowledgeGroupFormWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit lg:sticky lg:top-24">
      <div className="flex justify-between items-center mb-4 lg:mb-4">
        <h2 className="text-lg font-bold text-slate-700">Nueva Base</h2>
        {/* Botón que solo se ve en móvil para abrir/cerrar */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-purple-600 font-bold text-sm"
        >
          {isOpen ? "✕ Cerrar" : "+ Abrir Formulario"}
        </button>
      </div>

      <form action={createKnowledgeGroup} className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
          <input name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Descripción</label>
          <textarea name="description" rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
        </div>
        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md text-sm">
          + Guardar Base
        </button>
      </form>
    </div>
  );
}