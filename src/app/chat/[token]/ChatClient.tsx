"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, backgroundImageUrl, orgName, bgPositionMobile, bgPositionDesktop, bgPosXMobile, bgPosXDesktop }: any) {
  const [messages, setMessages] = useState([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg, token, history: messages.map(m => ({ role: m.role, text: m.content })) }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // CALCULAMOS LAS COORDENADAS
  const posX = isMobile ? (bgPosXMobile ?? 50) : (bgPosXDesktop ?? 50);
  const posY = isMobile ? (bgPositionMobile ?? 50) : (bgPositionDesktop ?? 50);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-sans bg-slate-900">
      
      {/* FONDO BLINDADO CONTRA DISTORSIÓN */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-no-repeat transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover', // <--- LA PALABRA MÁGICA: Respeta la proporción original siempre
            backgroundPosition: `${posX}% ${posY}%` 
          }}
        >
          {/* Capa de luz para que las burbujas se lean bien */}
          <div className={`absolute inset-0 transition-all duration-1000 ${isIntroActive ? 'bg-black/40' : 'bg-white/60 backdrop-blur-[1px]'}`}></div>
        </div>
      )}

      {/* PORTADA DE ENTRADA (MÁS TRASLÚCIDA) */}
      {backgroundImageUrl && isIntroActive && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
          <div className="text-center space-y-8 max-w-sm mx-auto">
            <div className="p-8 rounded-[3rem] border border-white/20 bg-transparent backdrop-blur-md shadow-2xl">
              <h2 className="text-white text-4xl font-black uppercase tracking-tighter mb-2 drop-shadow-2xl">{name}</h2>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-lg">{orgName}</p>
            </div>
            <button onClick={() => setIsIntroActive(false)} className="bg-emerald-500 hover:bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95">Iniciar Diálogo</button>
          </div>
        </div>
      )}

      {/* RESTO DEL CHAT (HEADER, MAIN, FOOTER) SE MANTIENEN IGUAL */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} className="w-10 h-10 object-contain rounded-lg" alt="Logo" /> : <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>}
            <h1 className="font-bold text-slate-800">{name}</h1>
          </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white/95 border border-slate-200 text-slate-800"}`}>
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                </div>
              </div>
            ))}
          </div>
      </main>

      <footer className="relative z-10 bg-white/70 backdrop-blur-md p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-3 bg-white/80 p-3 rounded-2xl border-2 border-slate-300">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={inputPlaceholder} className="flex-1 bg-transparent outline-none text-sm py-1 resize-none" rows={1} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">Enviar</button>
          </div>
      </footer>
    </div>
  );
}