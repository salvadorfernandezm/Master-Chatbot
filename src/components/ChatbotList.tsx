"use client";
import { useState } from "react";
import { updateChatbot, deleteChatbot, downloadChatInteractions } from "@/lib/actions";

function PencilIcon() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function TrashIcon() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>; }

function ChatbotCard({ bot, groups, knowledgeBases }: { bot: any, groups: any[], knowledgeBases: any[] }) {
  const [editingId, setEditingId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const res = await downloadChatInteractions(bot.id);
    if (res.success) {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Dialogos_${bot.name}.csv`);
      link.click();
    }
    setIsExporting(false);
  };

  return (
    <div className={`bg-white border-2 rounded-[2.5rem] shadow-md overflow-hidden mb-6 ${!bot.isActive ? 'opacity-60 border-slate-200' : 'border-slate-300'}`}>
      <div className="p-6 text-left">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-extrabold text-slate-800 text-xl">{bot.name}</h3>
            <div className="flex gap-2 mt-2">
              <span className="text-[9px] font-black bg-slate-100 px-2 py-1 rounded-lg uppercase text-slate-500 tracking-tighter">Base: {bot.knowledgeBase?.name || "Global"}</span>
              {bot.nameMode !== "HIDDEN" && <span className="text-[9px] font-black bg-indigo-100 px-2 py-1 rounded-lg uppercase text-indigo-600 tracking-tighter">📊 Investigación</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={isExporting} title="Bajar Diálogos" className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">{isExporting ? "..." : "📥"}</button>
            <button onClick={() => setEditingId(!editingId)} className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-sm"><PencilIcon /></button>
            <button onClick={() => { if(confirm("¿Borrar bot?")) deleteChatbot(bot.id) }} className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><TrashIcon /></button>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex justify-between items-center text-left">
            <span className="text-xs font-black text-purple-600">/chat/{bot.token}</span>
            <a href={`/chat/${bot.token}`} target="_blank" className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all">Probar ↗</a>
        </div>
      </div>

      {editingId && (
        <div className="p-8 bg-slate-50 border-t-2 border-slate-200 text-left animate-in slide-in-from-top-4 duration-300">
          <form action={updateChatbot} onSubmit={() => setEditingId(false)} className="space-y-8">
            <input type="hidden" name="id" value={bot.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" defaultValue={bot.name} required className="w-full p-3 rounded-xl border border-slate-200 bg-white" />
                <select name="knowledgeBaseId" defaultValue={bot.knowledgeBaseId} className="w-full p-3 rounded-xl border border-slate-200 bg-white">
                  {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                </select>
            </div>
            
            {/* SECCIÓN INVESTIGACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select name="nameMode" defaultValue={bot.nameMode || "HIDDEN"} className="p-3 rounded-xl border bg-white text-xs">
                    <option value="HIDDEN">🚫 Nombre Oculto</option>
                    <option value="OPTIONAL">💡 Nombre Opcional</option>
                    <option value="REQUIRED">🔒 Nombre Obligatorio</option>
                </select>
                <select name="emailMode" defaultValue={bot.emailMode || "HIDDEN"} className="p-3 rounded-xl border bg-white text-xs">
                    <option value="HIDDEN">🚫 Correo Oculto</option>
                    <option value="OPTIONAL">💡 Correo Opcional</option>
                    <option value="REQUIRED">🔒 Correo Obligatorio</option>
                </select>
                <select name="groupMode" defaultValue={bot.groupMode || "HIDDEN"} className="p-3 rounded-xl border bg-white text-xs">
                    <option value="HIDDEN">🚫 Grupo Oculto</option>
                    <option value="OPTIONAL">💡 Grupo Opcional</option>
                    <option value="REQUIRED">🔒 Grupo Obligatorio</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                <input name="backgroundImageUrl" defaultValue={bot.backgroundImageUrl || ""} placeholder="URL Fondo" className="p-3 rounded-xl border border-slate-100 outline-none text-xs" />
                <input name="logoUrl" defaultValue={bot.logoUrl || ""} placeholder="URL Logo" className="p-3 rounded-xl border border-slate-100 outline-none text-xs" />
            </div>

            <textarea name="systemInstructions" defaultValue={bot.systemInstructions || ""} rows={4} className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[10px]" />

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button type="button" onClick={() => setEditingId(false)} className="text-xs font-bold text-slate-400 px-6 uppercase">Cancelar</button>
              <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ChatbotList({ chatbots, groups, knowledgeBases }: { chatbots: any[], groups: any[], knowledgeBases: any[] }) {
  if (chatbots.length === 0) return <div className="p-10 text-center text-slate-400 italic text-left">No hay bots configurados.</div>;
  return <div>{chatbots.map(bot => (<ChatbotCard key={bot.id} bot={bot} groups={groups} knowledgeBases={knowledgeBases} />))}</div>;
}