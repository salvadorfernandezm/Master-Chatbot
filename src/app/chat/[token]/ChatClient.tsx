"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// --- AQUÍ ESTÁ EL ARREGLO: Agregamos infoMessage a las piezas permitidas ---
type ChatbotProps = {
  token: string;
  name: string;
  welcomeMessage: string;
  infoMessage?: string | null; // <-- Esta es la pieza que faltaba
  inputPlaceholder: string;
  logoUrl?: string | null;
  orgName: string;
}

export default function ChatClient({ 
  token, 
  name, 
  welcomeMessage, 
  infoMessage, // <-- Y la recibimos aquí
  inputPlaceholder, 
  logoUrl, 
  orgName 
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false); // Para el botón "i"
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Crece automáticamente el cuadro de texto
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
      if (!res.ok) throw new Error(data.error || "Error");

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ El sistema está un poco lento. Por favor, reintenta tu pregunta." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-40 w-full sticky top-0">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
          ) : (
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl">🎓</div>
          )}
          <div>
            <h1 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{name}</h1>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">{orgName}</p>
          </div>
        </div>

        {/* BOTÓN DE INFORMACIÓN "i" ESMERALDA */}
        {infoMessage && (
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-serif italic text-xl hover:bg-emerald-700 shadow-lg active:scale-90 transition-all ring-4 ring-white animate-pulse"
            title="Instrucciones del profesor"
          >
            i
          </button>
        )}
      </header>

      {/* VENTANA EMERGENTE DE REGLAMENTO */}
      {isInfoOpen && (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
    <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-6 text-center">Avisos Académicos</h3>
      
      <div className="max-h-[50vh] overflow-y-auto mb-8 pr-2">
        {/* LA MAGIA: Ahora el infoMessage usa Markdown igual que las respuestas del chat */}
        <div className="prose prose-slate prose-sm italic font-medium text-slate-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {infoMessage || "_Cargando avisos del profesor..._"}
          </ReactMarkdown>
        </div>
      </div>
      
      <button 
        onClick={() => setIsInfoOpen(false)}
        className="w-full py-4 bg-slate-900 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
      >
        Entendido
      </button>
    </div>
  </div>
)}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white shadow-xl rounded-tr-none" 
                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm"
                }`}
              >
                <div className="prose prose-slate max-w-none text-sm leading-relaxed prose-p:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-4 animate-pulse">Maestro respondiendo...</div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex items-end gap-3 bg-slate-100/80 rounded-2xl p-3 border focus-within:ring-2 focus-within:ring-purple-500 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent px-3 outline-none text-sm resize-none py-1 text-slate-700"
            disabled={loading}
          />
          <button 
            onClick={() => handleSubmit()} 
            disabled={loading || !input.trim()} 
            className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-purple-700 active:scale-90 transition-all disabled:opacity-30"
          >
             🚀
          </button>
        </div>
      </footer>
        {/* PEGA ESTO AQUÍ: Aviso de Error */}
        <div className="max-w-2xl mx-auto pb-4">
           <Link 
             href="/buzon/registro" 
             className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all bg-slate-50 py-2 rounded-xl border border-slate-100 mt-2"
           >
             <span>⚠️</span> ¿La IA cometió un error? Infórmanos para mejorar
           </Link>
        </div>
    </div>
  );
}