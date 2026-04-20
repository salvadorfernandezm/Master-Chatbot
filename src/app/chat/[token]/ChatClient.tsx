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
  inputPlaceholder: string;
  logoUrl?: string | null;
  orgName: string;
}

export default function ChatClient({ token, name, welcomeMessage, inputPlaceholder, logoUrl, orgName }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Función para que el cuadro crezca hacia arriba automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
    // Resetear altura del textarea tras enviar
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
      if (!res.ok) throw new Error(data.error || "Error al obtener respuesta");

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar el Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 w-full">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🤖
            </div>
          )}
          <div>
            <h1 className="font-bold text-slate-800">{name}</h1>
            <p className="text-xs text-slate-500 font-medium">Por {orgName}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                }`}
              >
                <div className="max-w-none prose prose-slate">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white border text-slate-400 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
                 Escribiendo...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500 shadow-inner transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              className="flex-1 bg-transparent px-2 py-1 outline-none text-slate-700 placeholder-slate-400 resize-none max-h-48 overflow-y-auto"
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl disabled:opacity-50 transition-colors shadow-md flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2 italic">
            Shift + Enter para nueva línea • Enter para enviar
          </p>
        </div>
      </footer>
    </div>
  );
}