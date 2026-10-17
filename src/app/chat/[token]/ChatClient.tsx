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
  backgroundImageUrl?: string | null;
  orgName: string;
}

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, backgroundImageUrl, orgName }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);

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
    <div className="relative flex flex-col h-screen overflow-hidden font-sans text-slate-900 bg-slate-200">
      
      {/* 1. PORTADA DE INMERSIÓN (AJUSTADA PARA PC Y CELULAR) */}
      {backgroundImageUrl && isIntroActive && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center animate-out fade-out duration-700">
          {/* Fondo de portada: en PC usamos 'contain' para no cortar caras, en móvil 'cover' */}
          <div 
            className="absolute inset-0 bg-slate-950 bg-no-repeat bg-center"
            style={{ 
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover' // Por defecto para celular
            }}
          />
          {/* Capa de atmósfera oscura */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          
          <div className="relative z-10 text-center p-6 space-y-8 max-w-sm mx-auto">
            {/* CUADRO MÁS TRASLÚCIDO (PUNTO 1) */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-2xl">
              <h2 className="text-white text-4xl font-black uppercase tracking-tighter mb-2 drop-shadow-md">{name}</h2>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">{orgName}</p>
            </div>
            
            <button 
              onClick={() => setIsIntroActive(false)}
              className="bg-emerald-500 hover:bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Iniciar Diálogo
            </button>
          </div>
        </div>
      )}

      {/* 2. FONDO DEL CHAT (MÁS NÍTIDO - PUNTO 2) */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundPosition: 'center 20%' 
          }}
        >
          {/* Reducimos la opacidad del blanco (de 75 a 40) y el desenfoque (de 4 a 1) para dar nitidez */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
        </div>
      )}

      {/* HEADER (Un poco más transparente para ver el fondo) */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
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

      {/* CHAT AREA (Burbujas un poco más traslúcidas para ver el fondo) */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-lg ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white shadow-indigo-200" 
                  : "bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800"
              }`}>
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
      <footer className="relative z-10 bg-white/70 backdrop-blur-md border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3 bg-white/80 p-3 rounded-2xl border-2 border-slate-300 focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={inputPlaceholder}
              className="flex-1 bg-transparent outline-none resize-none text-sm py-1"
            />
            <button onClick={handleSubmit} disabled={loading || !input.trim()} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all text-xs font-black uppercase">
               {loading ? "..." : "Enviar"}
            </button>
        </div>
      </footer>

      {/* MODAL DE INFORMACIÓN */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl">
            <h2 className="text-emerald-600 font-black uppercase text-xs tracking-widest mb-6 text-center italic font-serif">Acerca de este Asistente</h2>
            <div className="text-slate-700 text-sm leading-relaxed mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar prose prose-sm italic">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{infoMessage}</ReactMarkdown>
            </div>
            <button onClick={() => setIsInfoOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}