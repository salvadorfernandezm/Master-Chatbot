"use client";
import { useState, useRef, useEffect } from "react";
import { createProposal } from "@/lib/actions";

export default function SocraticChat() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [finalProposal, setFinalProposal] = useState("");
  const [socratesReflection, setSocratesReflection] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/excelencia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })) })
      });
      const data = await res.json();
      
      if (data.text && data.text.includes("[PROPUESTA_LISTA]")) {
        setIsReady(true);
        setFinalProposal(userMsg); 
        setSocratesReflection(data.text.replace("[PROPUESTA_LISTA]", "").trim());
        setMessages(prev => [...prev, { role: "bot", text: data.text.replace("[PROPUESTA_LISTA]", "").trim() }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: data.text }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: "Conexión perdida con el Ágora." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(formData: FormData) {
    const res = await createProposal(formData);
    if (res.success) {
      alert("¡Propuesta enviada al búnker! Gracias por poner tu corazón en la Facultad.");
      window.location.assign("/excelencia");
    } else {
      alert("Error al guardar.");
    }
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[700px] animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b-4 border-emerald-500">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦉</span>
          <div><p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Iniciativa de Excelencia</p><p className="text-xs text-slate-400 uppercase">Sócrates está en línea</p></div>
        </div>
      </div>

      {!isReady ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-12 px-6">
                <p className="text-slate-600 font-serif italic text-lg leading-relaxed">"La verdadera sabiduría está en reconocer la propia ignorancia."</p>
                <p className="text-slate-400 font-black mt-6 text-[10px] uppercase tracking-widest text-center w-full">Dime, ¿qué mejora propones para la Facultad?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400 animate-pulse ml-4 italic">Sócrates está analizando...</div>}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 flex gap-3 items-end">
            {/* PUNTO 1: TEXTAREA PARA QUE EL TEXTO SALTE DE LÍNEA */}
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }} 
              placeholder="Escribe tu idea..." 
              className="flex-1 bg-slate-100 p-5 rounded-2xl outline-none focus:border-emerald-500 border-2 border-transparent transition-all text-sm resize-none"
              rows={input.split('\n').length > 3 ? 3 : input.split('\n').length || 1}
            />
            <button onClick={sendMessage} disabled={loading} className="bg-slate-900 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all h-[58px]">Enviar</button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col bg-emerald-50 overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            {/* PUNTO 2: REFLEXIÓN DE SÓCRATES CON MÁS ESPACIO */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 relative">
               <span className="text-4xl absolute -top-4 -left-2">🦉</span>
               <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 ml-6 tracking-widest">Dictamen Final de Sócrates:</p>
               <p className="text-md text-slate-700 font-serif italic leading-relaxed">
                 "{socratesReflection}"
               </p>
            </div>

            <form action={handleFinalSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Propuesta para el Mural:</p>
                <textarea name="content" defaultValue={finalProposal} required rows={5} className="w-full p-6 rounded-[2rem] border-2 border-emerald-200 outline-none text-md bg-white text-slate-800 font-serif shadow-inner" />
                
                <input name="title" required placeholder="Título sugerido por ti" className="w-full p-5 rounded-2xl border-2 border-emerald-100 outline-none font-bold text-slate-900" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="studentName" placeholder="Tu Nombre (Opcional)" className="p-5 rounded-2xl border border-emerald-100 outline-none text-sm" />
                  <select name="category" required className="p-5 rounded-2xl border border-emerald-100 outline-none bg-white text-sm font-bold text-emerald-800">
                    <option value="ACADEMICA">Excelencia Académica</option>
                    <option value="LOGISTICA">Logística e Innovación</option>
                    <option value="DIALOGO">Diálogo Socrático</option>
                  </select>
                </div>
                
                <input type="hidden" name="aiFeedback" value={socratesReflection} />
                
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all active:scale-95 mt-4">
                  Publicar en el Mural Institucional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}