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
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "No obtuve respuesta." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión con el Maestro." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white relative font-sans">
      {/* HEADER CON LOGO Y BOTÓN i */}
      <header className="border-b bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg shadow-sm" />
          ) : (
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl">🎓</div>
          )}
          <div>
            <h1 className="font-black text-slate-900 text-sm md:text-base tracking-tight leading-none mb-1">{name}</h1>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">{orgName}</p>
          </div>
        </div>

        {infoMessage && (
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-9 w-9 rounded-full bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center font-serif italic text-lg hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-90"
          >
            i
          </button>
        )}
      </header>

      {/* VENTANA EMERGENTE (MODAL i) */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 transition-all">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-600 mb-6 text-center underline decoration-2 underline-offset-8">Avisos Académicos</h3>
            <div className="max-h-[40vh] overflow-y-auto mb-8 pr-2">
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic font-medium">
                {infoMessage}
              </div>
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 hover:bg-black transition-all"
            >
              Cerrar Información
            </button>
          </div>
        </div>
      )}

      {/* CUERPO DEL CHAT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/30">
        <div className="max-w-2xl mx-auto space-y-10 pb-10">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start animate-in slide-in-from-left-2 duration-300"}`}>
              <div className={`p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-slate-900 text-white shadow-xl rounded-tr-none border-b-4 border-slate-700" 
                  : "bg-white border border-slate-100 text-slate-800 rounded-tl-none ring-4 ring-slate-50/50"
              }`}>
                {/* SOLUCIÓN AL ERROR DE TYPE: Envolvemos en un div los estilos del Markdown */}
                <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-slate-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
             <div className="flex justify-start">
               <div className="bg-slate-100/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 py-2 rounded-full animate-pulse border border-slate-100">
                  El Maestro está redactando...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ENTRADA DE TEXTO */}
      <footer className="p-6 bg-white border-t sticky bottom-0 z-30">
        <div className="max-w-2xl mx-auto flex items-end gap-3 bg-slate-100/80 rounded-[1.5rem] p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-purple-400 focus-within:bg-white transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent px-3 outline-none text-sm resize-none py-2 text-slate-700 placeholder-slate-400"
            disabled={loading}
          />
          <button 
            onClick={() => handleSubmit()} 
            disabled={loading || !input.trim()} 
            className="bg-slate-900 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-10 hover:bg-black"
          >
             🚀
          </button>
        </div>
      </footer>
    </div>
  );
}