"use client";

import { useState } from "react";

export default function DirectorPanelPage() {
  const [pin, setPin] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkPin = async () => {
    if (pin === "2101") { 
      setIsAuthorized(true);
      setLoading(true);
      try {
        const res = await fetch('/api/buzon/directora');
        const data = await res.json();
        setTickets(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    } else {
      alert("PIN incorrecto.");
      setPin("");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-sm w-full bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-5xl mb-6">🏛️</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">Alta Gestión</h2>
          <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-center text-3xl font-black text-white outline-none mb-6" />
          <button onClick={checkPin} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold uppercase text-xs">Desbloquear</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white p-8 shadow-2xl flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase text-emerald-400 tracking-widest">Panel de Dirección</h1>
        <button onClick={() => window.location.reload()} className="text-xs bg-white/10 px-4 py-2 rounded-lg font-bold hover:bg-white/20">SALIR</button>
      </header>

      <div className="max-w-6xl mx-auto p-8 space-y-6 text-left">
        {loading ? <p className="text-center italic animate-pulse">Cargando...</p> : 
          tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
              <div className={`absolute top-0 left-0 w-2 h-full ${t.type === 'GRAVE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

{/* ARCHIVOS ADJUNTOS PARA LA DIRECTORA */}
{t.attachments && t.attachments.length > 0 && (
  <div className="mt-4 flex flex-wrap gap-2">
    {t.attachments.map((file: any) => (
      <a 
        key={file.id} 
        href={file.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 hover:bg-slate-200 transition-all"
      >
        📎 {file.name}
      </a>
    ))}
  </div>
)}
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{t.type}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">FOLIO: {t.folio}</span>
                  </div>
                  
                  <p className="text-slate-700 italic font-serif text-lg mt-4">"{ticket.content}"</p>

                 {/* GALERÍA DE EVIDENCIAS DEL ALUMNO (Añade esto) */}
{ticket.attachments && ticket.attachments.length > 0 && (
  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
    {ticket.attachments.map((file: any) => (
      <a 
        key={file.id} 
        href={file.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-100 flex items-center gap-1 hover:bg-blue-100 transition-all"
      >
        📎 {file.name} ({file.type === 'STUDENT' ? 'Alumno' : 'Autoridad'})
      </a>
    ))}
  </div>
)}
{/* ... resto del código (respuesta de autoridad, etc) ... */}

                  {/* RESPUESTA DE LA AUTORIDAD */}
                  {t.authorityResponse && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Respuesta del Funcionario:</p>
                      <p className="text-sm text-slate-600 italic">"{t.authorityResponse}"</p>
                    </div>
                  )}
                </div>
                
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${t.status === 'RESUELTO' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {t.status}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}