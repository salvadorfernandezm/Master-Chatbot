"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatbotProps = {
  token: string;
  name: string;
  welcomeMessage: string;
  infoMessage?: string | null; // <--- VARA MÁGICA
  inputPlaceholder: string;
  logoUrl?: string | null;
  orgName: string;
}

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, orgName }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false); // Estado para abrir el cuadro de info
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, token }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sin respuesta." }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Saturación. Reintenta en 15 seg." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{name}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{orgName}</p>
          </div>
        </div>

        {/* BOTÓN DE INFORMACIÓN "i" */}
        {infoMessage && (
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-8 w-8 rounded-full border-2 border-purple-100 text-purple-600 flex items-center justify-center font-serif italic text-lg hover:bg-purple-50 transition-all shadow-sm"
            title="Información importante"
          >
            i
          </button>
        )}
      </header>

      {/* CUADRO EMERGENTE DE INFORMACIÓN */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-purple-600 font-black text-xs uppercase tracking-widest mb-2 text-center">📌 Avisos del Profesor</h3>
            <div className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap italic">
              {infoMessage}
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-purple-600 text-white rounded-tr-none shadow-lg" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-slate max-w-none text-sm leading-relaxed">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400 animate-pulse ml-2">Maestro respondiendo...</div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white/80 backdrop-blur-md border-t">
        <div className="max-w-2xl mx-auto flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border focus-within:ring-2 focus-within:ring-purple-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent px-3 py-1 outline-none text-sm resize-none"
            disabled={loading}
          />
          <button onClick={() => handleSubmit()} disabled={loading || !input.trim()} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
}