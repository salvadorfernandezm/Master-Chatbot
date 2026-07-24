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

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
        body: JSON.stringify({ 
          message: userMsg, 
          history: messages.map(m => ({ 
            role: m.role === "user" ? "user" : "model", 
            parts: [{ text: m.text }] 
          })) 
        })
      });
      
      const data = await res.json();
      
      if (data.text && data.text.includes("[PROPUESTA_LISTA]")) {
        setIsReady(true);
        const cleanText = data.text.replace("[PROPUESTA_LISTA]", "").trim();
        setFinalProposal(cleanText);
        setMessages(prev => [...prev, { role: "bot", text: cleanText }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: data.text || data.error }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: "Sócrates se ha retirado a meditar. Intenta de nuevo en un momento." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(formData: FormData) {
    formData.append("content", finalProposal);
    formData.append("aiFeedback", "Validado por el Agente Socrático");
    const res = await createProposal(formData);
    if (res.success) {
      // Usamos un alert simple por ahora o redirigimos
      alert("¡Tu propuesta ha sido enviada al búnker para revisión final! Gracias por poner tu corazón en la Facultad.");
      window.location.assign("/excelencia");
    } else {
      alert("Error al guardar en el búnker.");
    }
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[650px] animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b-4 border-emerald-500">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦉</span>
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Mentoría de Excelencia</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Agente Socrático v1.0</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">?</div>
            <p className="text-slate-600 font-serif italic text-lg leading-relaxed">
              "Solo hay un bien: el conocimiento. Solo hay un mal: la ignorancia."
            </p>
            <p className="text-slate-400 font-black mt-6 text-[10px] uppercase tracking-widest">Cuéntame tu idea para mejorar la Facultad</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm ${
              m.role === "user" 
                ? "bg-emerald-600 text-white rounded-br-none" 
                : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-full flex gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        )}
      </div>

      {!isReady ? (
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Describe tu propuesta aquí..."
            className="flex-1 bg-slate-100 p-5 rounded-2xl outline-none focus:border-emerald-500 border-2 border-transparent transition-all text-sm font-medium"
          />
          <button 
            onClick={sendMessage} 
            disabled={loading}
            className="bg-slate-900 hover:bg-emerald-600 text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      ) : (
        <form action={handleFinalSubmit} className="p-10 bg-emerald-50 border-t-8 border-emerald-500 animate-in slide-in-from-bottom-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">✨</span>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">¡Excelente! Tu propuesta está lista.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Título de la propuesta</label>
              <input name="title" required placeholder="Ej: Actualización de acervo jurídico" className="w-full p-4 rounded-2xl border-2 border-emerald-200 outline-none focus:border-emerald-500 font-bold" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Tu Nombre (Opcional)</label>
                <input name="studentName" placeholder="Anónimo" className="w-full p-4 rounded-2xl border-2 border-emerald-100 outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Categoría</label>
                <select name="category" required className="w-full p-4 rounded-2xl border-2 border-emerald-100 outline-none bg-white text-sm">
                  <option value="ACADEMICA">Académica</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="DIALOGO">Diálogo e Innovación</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all active:scale-95 mt-4">
              Publicar en el Mural de Excelencia
            </button>
          </div>
        </form>
      )}
    </div>
  );
}