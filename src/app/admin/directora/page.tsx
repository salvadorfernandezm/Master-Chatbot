"use client";

import { useState, useEffect } from "react";
import { verifyDirectorPin } from "@/lib/actions";
import Link from "next/link"; // <-- Agregado para que funcionen los botones

export default function DirectoraPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleVerify = async () => {
    const ok = await verifyDirectorPin(pin);
    if (ok) {
        setAuthorized(true);
        localStorage.setItem("director_authenticated", "true"); // <-- LA RECUERDA
    } else alert("PIN Incorrecto");
  };

  useEffect(() => {
    // Al cargar, ver si ya estaba autorizada
    if (localStorage.getItem("director_authenticated") === "true") {
        setAuthorized(true);
    }
  }, []);

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return null;
    if (['mp4', 'mov', 'webm'].includes(ext || '')) return "🎥 Video";
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return "🎵 Audio";
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    if (['doc', 'docx'].includes(ext || '')) return "📝 Word";
    if (['xls', 'xlsx'].includes(ext || '')) return "📊 Excel";
    return "📁 Archivo";
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans text-center">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] border-b-8 border-purple-500 shadow-2xl">
          <h1 className="text-2xl font-black uppercase mb-6 tracking-widest">Acceso Directora</h1>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl mb-4 text-center text-xl text-white outline-none focus:border-purple-500" />
          <button onClick={handleVerify} className="w-full bg-purple-600 p-4 rounded-2xl font-black uppercase hover:bg-purple-500 transition-all">Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left text-slate-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-purple-400">Panel de Dirección</h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Supervisión Ética</p>
          </div>
          <div className="text-3xl font-black bg-white/10 w-16 h-16 rounded-full flex items-center justify-center">{tickets.length}</div>
        </header>

        {/* --- NUEVO BLOQUE DE ACCESO A IMPACTO PARA LA DIRECTORA --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link href="/admin/impacto" className="bg-emerald-600 text-white p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-500 transition-all shadow-xl">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase opacity-60">Resumen Estratégico</p>
              <h3 className="text-xl font-black uppercase">Ver Impacto Ético</h3>
            </div>
            <span className="text-4xl group-hover:scale-110 transition-transform">📊</span>
          </Link>
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-between opacity-50">
            <div className="text-left text-slate-400">
              <p className="text-[10px] font-black uppercase opacity-60">Estás viendo el:</p>
              <h3 className="text-xl font-black uppercase">Listado Detallado</h3>
            </div>
            <span className="text-4xl text-slate-300">📂</span>
          </div>
        </div>

        <div className="space-y-8">
          {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-300 uppercase">Cargando...</p> : 
            tickets.map((t) => (
              <div key={t.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{t.category || 'GENERAL'}</span>
                      <span className="text-slate-300">Folio: {t.folio}</span>
                    </div>
                    <h2 className="text-xl font-black underline decoration-purple-200 underline-offset-4">Reportante: {t.studentName || "Anónimo"}</h2>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">"{t.content}"</div>

                    {t.authorityResponse && (
                      <div className={`mt-6 p-8 rounded-[2.5rem] border-2 ${t.status === 'APELADO' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-[10px] font-black uppercase mb-3 ${t.status === 'APELADO' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {t.status === 'APELADO' ? '🚨 Registro de Apelación:' : '✅ Resolución Oficial:'}
                        </p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{t.authorityResponse}</p>
                      </div>
                    )}
                    
                    {t.attachments && t.attachments.length > 0 && (
                      <div className="pt-4 flex flex-wrap gap-3">
                        {t.attachments.map((att: any) => {
                          const icon = getFileIcon(att.url);
                          return (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="group relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 flex items-center justify-center bg-slate-50">
                              {icon ? <span className="text-[10px] font-black text-slate-400 text-center uppercase">{icon}</span> : <img src={att.url} className="h-full w-full object-cover" alt="evidencia" />}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="md:w-40 text-right">
                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl inline-block ${
                      t.status === 'PENDIENTE' ? 'bg-amber-500 text-white animate-pulse' : 
                      t.status === 'APELADO' ? 'bg-red-600 text-white animate-bounce' : 
                      t.status === 'NO ATENDIDO EN TIEMPO' ? 'bg-black text-red-500 border-2 border-red-500 animate-pulse' : 
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