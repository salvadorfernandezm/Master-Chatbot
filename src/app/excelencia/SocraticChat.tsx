"use client";
import { useState, useRef, useEffect } from "react";
import { createProposal } from "@/lib/actions";

export default function SocraticChat() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [finalProposal, setFinalProposal] = useState("");
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
        // Guardamos el último mensaje del alumno como la base de la propuesta
        setFinalProposal(userMsg); 
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
    // Si el alumno editó el texto final en el formulario, usamos ese
    const content = formData.get("content") as string;
    const res = await createProposal(formData);
    if (res.success) {
      alert("¡Propuesta enviada al búnker! Gracias por poner tu corazón en la Facultad.");
      window.location.assign("/excelencia");
    } else {
      alert("Error al guardar.");
    }
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[650px] animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b-4 border-emerald-500">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦉</span>
          <div><p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Iniciativa de Excelencia</p><p className="text-xs text-slate-400 uppercase">Sócrates está en línea</p></div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <p className="text-slate-600 font-serif italic text-lg leading-relaxed">"La verdadera sabiduría está en reconocer la propia ignorancia."</p>
            <p className="text-slate-400 font-black mt-6 text-[10px] uppercase tracking-widest text-center w-full">Dime, ¿qué mejora propones para la Facultad?</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 animate-pulse ml-4 italic">Sócrates está analizando...</div>}
      </div>

      {!isReady ? (
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribe tu idea..." className="flex-1 bg-slate-100 p-5 rounded-2xl outline-none focus:border-emerald-500 border-2 border-transparent transition-all text-sm" />
          <button onClick={sendMessage} disabled={loading} className="bg-slate-900 hover:bg-emerald-600 text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Enviar</button>
        </div>
      ) : (
        <form action={handleFinalSubmit} className="p-8 bg-emerald-50 border-t-8 border-emerald-500 animate-in slide-in-from-bottom-8 overflow-y-auto">
          <div className="space-y-4">
            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4">✨ Redacción Final de tu Propuesta</p>
            
            {/* ÁREA DE TEXTO PARA QUE EL ALUMNO PUEDA PULIR EL RESULTADO FINAL */}
            <textarea name="content" defaultValue={finalProposal} required rows={4} className="w-full p-4 rounded-xl border-2 border-emerald-200 outline-none text-sm bg-white text-slate-700 font-serif italic" />
            
            <input name="title" required placeholder="Título de la propuesta" className="w-full p-4 rounded-xl border-2 border-emerald-200 outline-none font-bold" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="studentName" placeholder="Tu Nombre (Opcional)" className="p-4 rounded-xl border border-emerald-200 outline-none text-sm" />
              <select name="category" required className="p-4 rounded-xl border border-emerald-200 outline-none bg-white text-sm font-bold text-emerald-800">
                <option value="ACADEMICA">Excelencia Académica</option>
                <option value="LOGISTICA">Logística e Innovación</option>
                <option value="DIALOGO">Diálogo Socrático</option>
              </select>
            </div>
            
            <input type="hidden" name="aiFeedback" value="Propuesta validada por Sócrates" />
            
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-xl">
              Publicar en el Mural
            </button>
          </div>
        </form>
      )}
    </div>
  );
}