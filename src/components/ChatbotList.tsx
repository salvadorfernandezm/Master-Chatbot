"use client";
import { useState } from "react";
import { updateChatbot, deleteChatbot } from "@/lib/actions";

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
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

function ChatbotCard({ bot, groups, knowledgeBases }: { bot: any, groups: any[], knowledgeBases: any[] }) {
  const [editingId, setEditingId] = useState(false);

  return (
    <div className={`bg-white border-2 rounded-3xl shadow-md overflow-hidden mb-6 ${!bot.isActive ? 'opacity-60 border-slate-200' : 'border-slate-500'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 text-left">
            <h3 className="font-extrabold text-slate-800 text-xl">{bot.name}</h3>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">Base: {bot.knowledgeBase?.name || "Sin asignar"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingId(!editingId)} className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-md">
                <PencilIcon />
            </button>
            <button onClick={() => { if(confirm("¿Borrar este bot?")) deleteChatbot(bot.id) }} className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><TrashIcon /></button>
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nombre del Bot</label>
                <input name="name" defaultValue={bot.name} required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Base de Conocimiento</label>
                <select name="knowledgeBaseId" defaultValue={bot.knowledgeBaseId} className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white">
                  {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-inner">
               <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-2 text-center">Diseño y Enfoque de Cámara</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">URL Logo (Círculo)</label>
                    <input name="logoUrl" defaultValue={bot.logoUrl || ""} placeholder="https://..." className="w-full p-3 rounded-xl border border-slate-100 outline-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">URL Fondo (Wallpaper)</label>
                    <input name="backgroundImageUrl" defaultValue={bot.backgroundImageUrl || ""} placeholder="https://..." className="w-full p-3 rounded-xl border border-slate-100 outline-none text-xs" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-50 mt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-emerald-600 uppercase ml-1">Enfoque Celular: {bot.bgPositionMobile || 50}%</label>
                    <input type="range" name="bgPositionMobile" min="0" max="100" defaultValue={bot.bgPositionMobile || 50} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-600 uppercase ml-1">Enfoque PC: {bot.bgPositionDesktop || 50}%</label>
                    <input type="range" name="bgPositionDesktop" min="0" max="100" defaultValue={bot.bgPositionDesktop || 50} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Instrucciones IA (Prompt)</label>
              <textarea name="systemInstructions" defaultValue={bot.systemInstructions || ""} rows={4} className="w-full p-3 rounded-xl border border-slate-200 outline-none font-mono text-[10px] bg-white" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingId(false)} className="text-sm font-bold text-slate-400 px-4 uppercase text-[10px]">Cancelar</button>
              <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-purple-700 transition-all">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ChatbotList({ chatbots, groups, knowledgeBases }: { chatbots: any[], groups: any[], knowledgeBases: any[] }) {
  if (chatbots.length === 0) return <div className="p-10 text-center text-slate-400 italic">No hay bots configurados.</div>;
  return (
    <div>
      {chatbots.map(bot => (
        <ChatbotCard key={bot.id} bot={bot} groups={groups} knowledgeBases={knowledgeBases} />
      ))}
    </div>
  );
}