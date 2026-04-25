"use client";
import { useState } from "react";
import { createGroup } from "@/app/actions/admin";

export default function GroupFormWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit lg:sticky lg:top-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700">Nuevo Grupo</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-purple-600 font-bold text-sm">
          {isOpen ? "✕ Cerrar" : "+ Crear"}
        </button>
      </div>
      <form action={createGroup} className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-4`}>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre del Grupo</label>
          <input name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm" placeholder="Ej. Ética Profesional A" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Descripción</label>
          <textarea name="description" rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm" />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-md text-sm">+ Guardar Grupo</button>
      </form>
    </div>
  );
}