"use client";
import { useState } from "react";
import { updateChatbot, deleteChatbot } from "@/lib/actions";

// ... (Mantenemos PencilIcon y TrashIcon igual)

function ChatbotCard({ bot, groups, knowledgeBases }: { bot: any, groups: any[], knowledgeBases: any[] }) {
  const [editingId, setEditingId] = useState(false);

  return (
    <div className={`bg-white border-2 rounded-3xl shadow-md overflow-hidden mb-6 ${!bot.isActive ? 'opacity-60 border-slate-200' : 'border-slate-500'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 text-left">
            <h3 className="font-extrabold text-slate-800 text-xl">{bot.name}</h3>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold">Base: {bot.knowledgeBase.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingId(!editingId)} className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-purple-600 hover:text-white transition-all"><PencilIcon /></button>
            <button onClick={() => deleteChatbot(bot.id)} className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><TrashIcon /></button>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-500 flex justify-between items-center">
            <span className="text-xs font-black text-purple-600">/chat/{bot.token}</span>
            <a href={`/chat/${bot.token}`} target="_blank" className="text-[10px] font-black uppercase bg-slate-900 text-white px-4 py-2 rounded-xl">Probar Chat</a>
        </div>
      </div>

      {editingId && (
        <div className="p-6 bg-slate-50 border-t border-slate-500 text-left">
          <form action={updateChatbot} onSubmit={() => setEditingId(false)} className="space-y-4">
            <input type="hidden" name="id" value={bot.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" defaultValue={bot.name} placeholder="Nombre" className="p-3 rounded-xl border border-slate-200" />
              <select name="knowledgeBaseId" defaultValue={bot.knowledgeBaseId} className="p-3 rounded-xl border border-slate-200">
                {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
              </select>
            </div>

            {/* SECCIÓN DE APARIENCIA Y CÁMARA */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
               <p className="text-[10px] font-black uppercase text-purple-600">Diseño y Enfoque de Cámara</p>
               <input name="logoUrl" defaultValue={bot.logoUrl || ""} placeholder="URL Logo" className="w-full p-3 rounded-xl border border-slate-100 text-xs" />
               <input name="backgroundImageUrl" defaultValue={bot.backgroundImageUrl || ""} placeholder="URL Fondo" className="w-full p-3 rounded-xl border border-slate-100 text-xs" />
               
               <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Enfoque Celular: {bot.bgPositionMobile}%</label>
                    <input type="range" name="bgPositionMobile" min="0" max="100" defaultValue={bot.bgPositionMobile || 50} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Enfoque PC: {bot.bgPositionDesktop}%</label>
                    <input type="range" name="bgPositionDesktop" min="0" max="100" defaultValue={bot.bgPositionDesktop || 50} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  </div>
               </div>
            </div>

            <textarea name="systemInstructions" defaultValue={bot.systemInstructions || ""} rows={4} className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[10px]" />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingId(false)} className="text-sm font-bold text-slate-400 px-4">Cancelar</button>
              <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
// ... (ChatbotList se mantiene igual)