"use client";

import { useState } from "react";
import { updateChatbot, deleteChatbot } from "@/app/actions/admin";

interface Chatbot {
  id: string;
  name: string;
  token: string;
  isActive: boolean; // Añadido
  welcomeMessage: string | null;
  systemInstructions: string | null;
  fallbackMessage: string | null;
  inputPlaceholder: string | null;
  group: { name: string };
  knowledgeBase: { name: string };
}

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

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function ChatbotCard({ bot }: { bot: Chatbot }) {
  const [editingId, setEditingId] = useState(false);
  const [copied, setCopied] = useState<"link" | "whatsapp" | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el chatbot "${bot.name}"?\n⚠️ Los alumnos ya no podrán acceder a su enlace.`)) return;
    await deleteChatbot(bot.id);
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    const formData = new FormData();
    formData.append("id", bot.id);
    formData.append("isActive", String(!bot.isActive));
    
    await updateChatbot(formData);
    
    setIsToggling(false);
    // Refrescamos la página para que el botón cambie de color
    window.location.reload(); 
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/chat/${bot.token}`;
    navigator.clipboard.writeText(url);
    setCopied("link");
    setTimeout(() => setCopied(null), 2500);
  };

  const handleCopyWhatsApp = () => {
    const url = `${window.location.origin}/chat/${bot.token}`;
    const message = 
`🎓 *${bot.name}* — Tu Tutor IA

Hola! Quiero compartirte el acceso a tu asistente de inteligencia artificial para este curso.

Está disponible las 24 horas y con gusto responderá tus preguntas.

👉 Accede aquí: ${url}`;
    navigator.clipboard.writeText(message);
    setCopied("whatsapp");
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${!bot.isActive ? 'opacity-60 grayscale-[0.5] border-slate-200' : 'border-slate-100'}`}>
      {/* Header del Bot */}
      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-slate-800 text-lg">{bot.name}</h3>
            
            {/* INTERRUPTOR DE ESTADO */}
            <button 
              onClick={handleToggleActive}
              disabled={isToggling}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                bot.isActive 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-slate-400 text-white hover:bg-slate-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full bg-white ${bot.isActive ? 'animate-pulse' : ''}`}></div>
              {isToggling ? 'Cambiando...' : (bot.isActive ? 'En Línea' : 'Apagado')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase">Grupo</p>
              <p className="font-semibold text-slate-700">{bot.group.name}</p>
            </div>
            <div className="px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-purple-400 text-[10px] font-bold uppercase">Base IA</p>
              <p className="font-semibold text-purple-700 truncate">{bot.knowledgeBase.name}</p>
            </div>
          </div>

          {/* Link de Acceso */}
          {bot.isActive && (
            <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Link de Acceso Académico</span>
              <a
                href={`/chat/${bot.token}`}
                target="_blank"
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 group w-fit"
              >
                <span>/chat/{bot.token}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              </a>
            </div>
          )}

          {/* Botones de Compartir (Solo si está activo) */}
          {bot.isActive && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopyLink}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${copied === "link" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <CopyIcon />
                {copied === "link" ? "¡Copiado!" : "Copiar Enlace"}
              </button>
              <button
                onClick={handleCopyWhatsApp}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${copied === "whatsapp" ? "bg-green-50 border-green-200 text-green-700" : "bg-green-600 border-green-600 text-white hover:bg-green-700"}`}
              >
                <span>📱</span>
                {copied === "whatsapp" ? "¡Mensaje listo!" : "WhatsApp"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start mt-1">
          <button
            onClick={() => setEditingId(!editingId)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${editingId ? 'bg-slate-200 text-slate-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
          >
            <PencilIcon />
            {editingId ? 'Cerrar' : 'Config.'}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Panel de Configuración Expandible */}
      {editingId && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs font-black text-purple-500 uppercase tracking-widest mt-4 mb-4">⚙️ Personalidad del Tutor</p>
          <form action={updateChatbot} onSubmit={() => setEditingId(false)} className="space-y-4">
            <input type="hidden" name="id" value={bot.id} />
            <input type="hidden" name="isActive" value={String(bot.isActive)} />

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nombre del Chatbot</label>
              <input
                name="name"
                defaultValue={bot.name}
                required
                className="w-full px-4 py-2 text-sm border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-purple-50/50 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Mensaje de Bienvenida</label>
                <textarea
                  name="welcomeMessage"
                  defaultValue={bot.welcomeMessage || ""}
                  rows={2}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Texto del Teclado</label>
                <input
                  name="inputPlaceholder"
                  defaultValue={bot.inputPlaceholder || ""}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Directivas del Cerebro (System Prompt)</label>
              <textarea
                name="systemInstructions"
                defaultValue={bot.systemInstructions || ""}
                rows={4}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingId(false)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ChatbotList({ chatbots }: { chatbots: Chatbot[] }) {
  if (chatbots.length === 0) return <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">No hay chatbots creados.</div>;
  return <div className="space-y-4">{chatbots.map(bot => <ChatbotCard key={bot.id} bot={bot} />)}</div>;
}