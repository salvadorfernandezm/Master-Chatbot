"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

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
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      if (!res.ok) throw new Error(data.error || "Saturación");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ El sistema está un poco saturado. Reintenta en 15 segundos." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>
            )}
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">{name}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{orgName}</p>
            </div>
          </div>

          {infoMessage && (
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="h-9 w-9 rounded-full border-2 border-emerald-500 text-emerald-500 font-black flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
            >
              i
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 md:p-8"> {/* Bajamos p-4 a p-3 */}
  <div className="max-w-3xl mx-auto space-y-4"> {/* Bajamos space-y-6 a 4 */}
    {messages.map((msg, i) => (
      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
        <div 
          className={`max-w-[90%] md:max-w-[75%] p-3 md:p-4 rounded-2xl ${
            msg.role === "user" 
              ? "bg-indigo-600 text-white shadow-lg" 
              : "bg-white border border-slate-200 shadow-sm text-slate-800"
          }`}
        >
          {/* AQUÍ ESTÁ EL TRUCO: text-[13px] para móvil, sm para PC */}
          <div className="prose prose-slate max-w-none text-[13px] md:text-sm leading-snug md:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    ))}
    <div ref={messagesEndRef} />
  </div>
</main>

      <footer className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={inputPlaceholder}
              className="flex-1 bg-transparent outline-none resize-none text-sm py-1"
              disabled={loading}
            />
            <button onClick={() => handleSubmit()} disabled={loading || !input.trim()} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-all">
               {loading ? "..." : "🚀"}
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <Link href="/buzon/registro?type=SOPORTE_TECNICO" className="text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">
              ⚠️ Reportar un fallo técnico
            </Link>
          </div>
        </div>
      </footer>

      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-t-8 border-emerald-500">
            <h2 className="text-emerald-600 font-black uppercase text-xs tracking-[0.2em] mb-6 text-center">Información del Profesor</h2>
            <div className="text-slate-700 text-sm leading-relaxed mb-10 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              <div className="prose prose-slate max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{infoMessage}</ReactMarkdown>
              </div>
            </div>
            <button onClick={() => setIsInfoOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}