"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string; };

interface ChatbotProps {
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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

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
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Error de respuesta." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white relative font-sans">
      <header className="border-b bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl">🎓</div>
          <div>
            <h1 className="font-black text-slate-800 text-sm tracking-tight leading-none mb-1">{name}</h1>
            <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">{orgName}</p>
          </div>
        </div>

        {/* AQUÍ ESTÁ EL BOTÓN DE INFORMACIÓN */}
        {infoMessage && (
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-9 w-9 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-serif italic text-lg hover:bg-slate-200 transition-all shadow-inner active:scale-90"
          >
            i
          </button>
        )}
      </header>

      {/* VENTANA EMERGENTE */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 mb-4 text-center">Información Importante</h3>
            <div className="max-h-[50vh] overflow-y-auto mb-8 pr-2">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                {infoMessage}
              </p>
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/50">
        <div className="max-w-2xl mx-auto space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-5 rounded-3xl text-sm leading-relaxed ${msg.role === "user" ? "bg-slate-900 text-white shadow-2xl rounded-tr-none" : "bg-white border-2 border-slate-100 text-slate-800 shadow-sm rounded-tl-none"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose max-w-none">{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-6 bg-white border-t sticky bottom-0 z-30">
        <div className="max-w-2xl mx-auto flex items-end gap-3 bg-slate-100 rounded-3xl p-3 focus-within:ring-2 focus-within:ring-purple-400 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent px-3 outline-none text-sm resize-none py-2"
          />
          <button onClick={() => handleSubmit()} disabled={!input.trim()} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-20">
             🚀
          </button>
        </div>
      </footer>
    </div>
  );
}