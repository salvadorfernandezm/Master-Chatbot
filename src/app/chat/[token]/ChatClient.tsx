"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatClient({ token, name, welcomeMessage, infoMessage, inputPlaceholder, logoUrl, backgroundImageUrl, orgName, bgPositionMobile, bgPositionDesktop, bgPosXMobile, bgPosXDesktop, showIntro, introPos, collectData, groupOptions }: any) {
  const [messages, setMessages] = useState([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(showIntro ?? true);
  const [isMobile, setIsMobile] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Estados para identidad del alumno
  const [showRegForm, setShowRegForm] = useState(false);
  const [studentData, setStudentData] = useState({ name: "", email: "", group: "" });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          message: userMsg, 
          token, 
          history: messages.map(m => ({ role: m.role, text: m.content })),
          studentName: studentData.name,
          studentEmail: studentEmailFix(studentData.email),
          studentGroup: studentData.group
        }) 
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Función auxiliar para evitar errores de envío
  function studentEmailFix(email: string) {
    return email.trim() === "" ? "anonimo@ujed.mx" : email;
  }

  const posX = isMobile ? (bgPosXMobile ?? 50) : (bgPosXDesktop ?? 50);
  const posY = isMobile ? (bgPositionMobile ?? 50) : (bgPositionDesktop ?? 50);

  // Convertimos las opciones de grupo en un array de strings
  const groups: string[] = groupOptions ? groupOptions.split(',').map((g: string) => g.trim()) : [];

  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-sans bg-slate-900 text-left">
      
      {/* 1. FONDO PRINCIPAL */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-no-repeat pointer-events-none"
          style={{ 
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: `${posX}% ${posY}%` 
          }}
        >
          <div className={`absolute inset-0 transition-all duration-1000 ${isIntroActive ? 'bg-black/40' : 'bg-white/60'}`}></div>
        </div>
      )}

      {/* 2. PORTADA DE INMERSIÓN / REGISTRO */}
      {backgroundImageUrl && isIntroActive && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[2px]">
          <div 
            className="text-center space-y-6 max-w-sm w-full mx-auto transition-all duration-700"
            style={!showRegForm ? { top: `${introPos ?? 50}%`, transform: 'translateY(-50%)', position: 'absolute' } : {}}
          >
            {!showRegForm ? (
              <>
                <div className="p-8 rounded-[3rem] border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl">
                    <h2 className="text-white text-3xl font-black uppercase tracking-tighter mb-2 drop-shadow-2xl">{name}</h2>
                    <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.4em]">{orgName}</p>
                </div>
                <button 
                  onClick={() => collectData ? setShowRegForm(true) : setIsIntroActive(false)} 
                  className="bg-emerald-500 hover:bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 cursor-pointer"
                >
                  Iniciar Diálogo
                </button>
              </>
            ) : (
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl space-y-5 animate-in zoom-in duration-300">
                <div className="text-left border-l-4 border-emerald-500 pl-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Registro Académico</p>
                  <h3 className="text-lg font-black text-slate-800 uppercase leading-none">Identifícate</h3>
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Nombre Completo" 
                    className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all text-slate-900"
                    onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Correo Institucional" 
                    className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all text-slate-900"
                    onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                  />
                  {groups.length > 0 && (
                    <select 
                      className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all text-slate-900"
                      onChange={(e) => setStudentData({...studentData, group: e.target.value})}
                    >
                      <option value="">Selecciona tu Profesor</option>
                      {groups.map((g: string, i: number) => ( // <--- AQUÍ CORREGIMOS EL ERROR DE TIPO
                        <option key={i} value={g}>{g}</option>
                      ))}
                    </select>
                  )}
                </div>

                <button 
                  disabled={!studentData.name || !studentData.email || (groups.length > 0 && !studentData.group)}
                  onClick={() => setIsIntroActive(false)} 
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-30"
                >
                  Entrar al Liceo
                </button>
                <button onClick={() => setShowRegForm(false)} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regresar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CABECERA */}
      <header className="relative z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} className="w-10 h-10 object-contain rounded-lg shadow-sm" alt="Logo" /> : <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>}
            <h1 className="font-bold text-slate-800 text-sm md:text-base">{name}</h1>
          </div>
          {infoMessage && (
            <button type="button" onClick={() => setIsInfoOpen(true)} className="h-10 w-10 rounded-full bg-emerald-500 text-white font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center cursor-pointer">i</button>
          )}
      </header>

      {/* CHAT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white/95 border border-slate-200 text-slate-800 shadow-sm"}`}>
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-30 bg-white/80 backdrop-blur-md p-4 border-t border-slate-200">
          <div className="max-w-3xl mx-auto flex items-end gap-3 bg-white/90 p-3 rounded-2xl border-2 border-slate-300">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={inputPlaceholder} className="flex-1 bg-transparent outline-none text-sm py-1 resize-none" rows={1} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs cursor-pointer">Enviar</button>
          </div>
      </footer>

      {/* MODAL INFO */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-t-8 border-emerald-500 text-left">
            <h2 className="text-emerald-600 font-black uppercase text-xs tracking-widest mb-6 text-center italic font-serif">Información</h2>
            <div className="text-slate-700 text-sm leading-relaxed mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="prose prose-sm italic"><ReactMarkdown remarkPlugins={[remarkGfm]}>{infoMessage}</ReactMarkdown></div>
            </div>
            <button onClick={() => setIsInfoOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}