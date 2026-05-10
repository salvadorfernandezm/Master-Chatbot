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
  infoMessage?: string | null;
  inputPlaceholder: string;
  logoUrl?: string | null;
  orgName: string;
}

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, orgName }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">🤖</div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{name}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{orgName}</p>
          </div>
        </div>

        {infoMessage && (
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-8 w-8 rounded-full border-2 border-purple-100 text-purple-600 flex items-center justify-center font-serif italic text-lg hover:bg-purple-50 transition-all shadow-sm active:scale-90"
            title="Información importante"
          >
            i
          </button>
        )}
      </header>

      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-4" />
            <h3 className="text-purple-600 font-black text-[11px] uppercase tracking-[0.2em] mb-3 text-center">📌 Avisos del Profesor</h3>
            <div className="max-h-[60vh] overflow-y-auto">
                <div className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap italic">
                    {infoMessage}
                </div>
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
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
              <div 
                className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-purple-600 text-white rounded-tr-none shadow-md" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm"}`}
              >
                <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-4 flex items-center gap-2">
                 <div className="flex gap-1">
                   <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                   <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                 </div>
                 Consultando al Maestro
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-white p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500 shadow-sm transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={inputPlaceholder}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-slate-700 placeholder-slate-400 min-h-[24px]"
              disabled={loading}
            />
            <button 
              onClick={() => handleSubmit()} 
              disabled={loading || !input.trim()} 
              className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-colors disabled:bg-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}