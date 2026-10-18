"use client";
import { useState } from "react";
import { updateChatbot, deleteChatbot } from "@/lib/actions";

// ... (PencilIcon y TrashIcon igual)

function ChatbotCard({ bot, groups, knowledgeBases }: { bot: any, groups: any[], knowledgeBases: any[] }) {
  const [editingId, setEditingId] = useState(false);

  return (
    <div className={`bg-white border-2 rounded-3xl shadow-md overflow-hidden mb-6 ${!bot.isActive ? 'opacity-60 border-slate-200' : 'border-slate-500'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4 text-left">
          <div className="flex-1">
            <h3 className="font-extrabold text-slate-800 text-xl">{bot.name}</h3>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-lg uppercase">Base: {bot.knowledgeBase?.name || "Global"}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingId(!editingId)} className="p-2 bg-slate-100 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><PencilIcon /></button>
            <button onClick={() => deleteChatbot(bot.id)} className="p-2 bg-slate-100 rounded-xl hover:bg-red-500 hover:text-white transition-all"><TrashIcon /></button>
          </div>
        </div>
      </div>

      {editingId && (
        <div className="p-6 bg-slate-50 border-t border-slate-500 text-left">
          <form action={updateChatbot} onSubmit={() => setEditingId(false)} className="space-y-4">
            <input type="hidden" name="id" value={bot.id} />
            <input name="name" defaultValue={bot.name} className="w-full p-3 rounded-xl border border-slate-200 mb-4" />

            <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-6 shadow-inner">
               <p className="text-[10px] font-black uppercase text-purple-600 text-center tracking-widest">Ajuste de Cámara del Liceo</p>
               
               <input name="backgroundImageUrl" defaultValue={bot.backgroundImageUrl || ""} placeholder="URL de la imagen de fondo" className="w-full p-3 rounded-xl border border-slate-100 text-xs" />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* CONTROLES CELULAR */}
                  <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-700 uppercase">📱 Enfoque Móvil</p>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Vertical: {bot.bgPositionMobile}%</label>
                      <input type="range" name="bgPositionMobile" min="0" max="100" defaultValue={bot.bgPositionMobile || 50} className="w-full h-1.5 accent-emerald-500" />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Horizontal: {bot.bgPosXMobile}%</label>
                      <input type="range" name="bgPosXMobile" min="0" max="100" defaultValue={bot.bgPosXMobile || 50} className="w-full h-1.5 accent-emerald-500" />
                    </div>
                  </div>

                  {/* CONTROLES PC */}
                  <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-700 uppercase">💻 Enfoque Computadora</p>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Vertical: {bot.bgPositionDesktop}%</label>
                      <input type="range" name="bgPositionDesktop" min="0" max="100" defaultValue={bot.bgPositionDesktop || 50} className="w-full h-1.5 accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Horizontal: {bot.bgPosXDesktop}%</label>
                      <input type="range" name="bgPosXDesktop" min="0" max="100" defaultValue={bot.bgPosXDesktop || 50} className="w-full h-1.5 accent-blue-500" />
                    </div>
                  </div>
               </div>
            </div>

            <textarea name="systemInstructions" defaultValue={bot.systemInstructions || ""} rows={3} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingId(false)} className="text-xs font-bold text-slate-400 px-4">CANCELAR</button>
              <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg">GUARDAR</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ChatbotList({ chatbots, groups, knowledgeBases }: { chatbots: any[], groups: any[], knowledgeBases: any[] }) {
  return <div>{chatbots.map(bot => <ChatbotCard key={bot.id} bot={bot} groups={groups} knowledgeBases={knowledgeBases} />)}</div>;
}