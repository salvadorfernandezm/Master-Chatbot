"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string; };

type ChatbotProps = {
  token: string;
  name: string;
  welcomeMessage: string;
  infoMessage?: string | null;
  inputPlaceholder: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null; // <--- RECIBIMOS EL FONDO
  orgName: string;
}

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, backgroundImageUrl, orgName }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    
    const historyForAPI = messages.map(m => ({ role: m.role, text: m.content }));
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, token, history: historyForAPI }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error de conexión." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-sans text-slate-900 bg-slate-100">
      
      {/* CAPA DE FONDO (WALLPAPER) */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
          {/* Capa de suavizado para que el texto sea legible */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} className="w-10 h-10 object-contain rounded-lg shadow-sm" alt="Logo" /> : <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>}
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">{name}</h1>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{orgName}</p>
            </div>
          </div>
          {infoMessage && (
            <button onClick={() => setIsInfoOpen(true)} className="h-8 w-8 rounded-full border-2 border-emerald-500 text-emerald-500 font-black hover:bg-emerald-500 hover:text-white transition-all">i</button>
          )}
        </div>
      </header>

      {/* CHAT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white/90 border border-slate-200 text-slate-800"}`}>
                <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white p-3 rounded-2xl border-2 border-slate-200 focus-within:border-indigo-500 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={inputPlaceholder}
              className="flex-1 bg-transparent outline-none resize-none text-sm py-1"
            />
            <button onClick={handleSubmit} disabled={loading || !input.trim()} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-30">
               {loading ? "..." : "🚀"}
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL DE INFORMACIÓN */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl">
            <h2 className="text-emerald-600 font-black uppercase text-xs tracking-widest mb-6 text-center italic">Acerca de este Asistente</h2>
            <div className="text-slate-700 text-sm leading-relaxed mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar prose prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{infoMessage}</ReactMarkdown>
            </div>
            <button onClick={() => setIsInfoOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}