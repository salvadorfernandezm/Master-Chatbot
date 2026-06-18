"use client";

import { useState, useEffect } from "react";
import { verifyDirectorPin } from "@/lib/vault";
import Link from "next/link";

export default function DirectoraPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleVerify = async () => {
    const ok = await verifyDirectorPin(pin);
    if (ok) setAuthorized(true);
    else alert("PIN Incorrecto");
  };

  useEffect(() => {
    if (authorized) {
      fetch('/api/buzon/directora')
        .then(res => res.json())
        .then(data => { setTickets(data); setLoading(false); });
    }
  }, [authorized]);

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return null;
    if (['mp4', 'mov', 'webm'].includes(ext || '')) return "🎥 Video";
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return "🎵 Audio";
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    if (['doc', 'docx'].includes(ext || '')) return "📝 Word"; // <--- Soporte para Word
    if (['xls', 'xlsx'].includes(ext || '')) return "📊 Excel"; // <--- Soporte para Excel
    return "📁 Archivo";
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] border-b-8 border-purple-500 shadow-2xl text-center">
          <h1 className="text-2xl font-black uppercase mb-6 tracking-widest">Acceso Directora</h1>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Introduce el PIN" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl mb-4 text-center text-xl outline-none focus:border-purple-500" />
          <button onClick={handleVerify} className="w-full bg-purple-600 p-4 rounded-2xl font-black uppercase hover:bg-purple-500 transition-all">Entrar al Panel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-purple-400">Panel de Dirección</h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Casos de Ética y Academia</p>
          </div>
          <div className="text-3xl font-black bg-white/10 w-16 h-16 rounded-full flex items-center justify-center border border-white/10">{tickets.length}</div>
        </header>

        <div className="space-y-8">
          {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-300 uppercase tracking-widest">Cargando...</p> : 
            tickets.map((t) => (
              <div key={t.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{t.category || 'SIN CATEGORÍA'}</span>
                      <span className="text-slate-300 font-bold">Folio: {t.folio}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 underline decoration-purple-200 underline-offset-4">Reportante: {t.studentName || "Anónimo"}</h2>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">"{t.content}"</div>
                    
                    {/* VISUALIZACIÓN DE EVIDENCIAS PARA LA DIRECTORA */}
                    {t.attachments && t.attachments.length > 0 && (
                      <div className="pt-4">
                        <p className="text-[10px] font-black uppercase text-purple-600 mb-3 tracking-widest">Evidencias Adjuntas:</p>
                        <div className="flex flex-wrap gap-3">
                          {t.attachments.map((att: any) => {
                            const icon = getFileIcon(att.url);
                            return (
                              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="group relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-purple-500 transition-all bg-slate-50 flex items-center justify-center">
                                {icon ? <span className="text-[10px] font-black text-slate-400 text-center p-2 uppercase leading-none">{icon}</span> : 
                                  <img src={att.url} className="h-full w-full object-cover" alt="evidencia" />}
                                <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[9px] text-white font-black bg-purple-600 px-2 py-1 rounded-md">VER</span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:w-40 text-right">
  <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl inline-block ${
    t.status === 'PENDIENTE' ? 'bg-amber-500 text-white animate-pulse' : 
    t.status === 'APELADO' ? 'bg-red-600 text-white animate-bounce' : 
    'bg-emerald-600 text-white'
  }`}>
    {t.status}
  </span>
</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}