"use client";
import { useState } from "react";
import { createProposal } from "@/lib/actions";

export default function SocraticChat() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [finalProposal, setFinalProposal] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/excelencia/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg, history: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })) })
      });
      const data = await res.json();
      
      if (data.text.includes("[PROPUESTA_LISTA]")) {
        setIsReady(true);
        // Extraemos la propuesta limpia quitando la palabra clave
        setFinalProposal(data.text.replace("[PROPUESTA_LISTA]", "").trim());
      }
      
      setMessages(prev => [...prev, { role: "bot", text: data.text.replace("[PROPUESTA_LISTA]", "") }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: "Lo siento, mi conexión con el ágora se ha perdido. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(formData: FormData) {
    formData.append("content", finalProposal);
    formData.append("aiFeedback", "Validado por Sócrates");
    const res = await createProposal(formData);
    if (res.success) {
      window.location.assign("/excelencia?success=true");
    } else {
      alert("Error al guardar en el búnker.");
    }
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦉</span>
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Agente Socrático</p>
            <p className="text-xs text-slate-300">Puliendo la excelencia...</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400 italic text-sm">"Una vida sin examen no merece ser vivida."</p>
            <p className="text-slate-500 font-bold mt-4 text-xs uppercase">Cuéntame, ¿qué mejora imaginas para nuestra facultad?</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 animate-pulse">Sócrates está pensando...</div>}
      </div>

      {!isReady ? (
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu idea aquí..."
            className="flex-1 bg-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 border-2 border-transparent transition-all text-sm"
          />
          <button onClick={sendMessage} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all">
            发送
          </button>
        </div>
      ) : (
        <form action={handleFinalSubmit} className="p-8 bg-emerald-50 border-t-4 border-emerald-500 animate-in slide-in-from-bottom-4">
          <p className="text-xs font-black text-emerald-700 uppercase mb-4">✨ ¡Propuesta validada por Sócrates!</p>
          <div className="space-y-4">
            <input name="title" required placeholder="Título corto de tu propuesta" className="w-full p-4 rounded-xl border border-emerald-200 outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input name="studentName" placeholder="Tu nombre (opcional)" className="p-4 rounded-xl border border-emerald-200 outline-none text-sm" />
              <select name="category" required className="p-4 rounded-xl border border-emerald-200 outline-none text-sm bg-white">
                <option value="ACADEMICA">Académica</option>
                <option value="LOGISTICA">Logística</option>
                <option value="DIALOGO">Diálogo Socrático</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-emerald-700 transition-all">
              Publicar Propuesta Oficialmente
            </button>
          </div>
        </form>
      )}
    </div>
  );
}