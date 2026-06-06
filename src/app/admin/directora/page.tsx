"use client";

import { useState } from "react";

export default function DirectorPanelPage() {
  const [pin, setPin] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkPin = async () => {
    if (pin === "2101") { // Tu PIN de seguridad
      setIsAuthorized(true);
      setLoading(true);
      try {
        const res = await fetch('/api/buzon/directora');
        const data = await res.json();
        setTickets(data);
      } catch (e) {
        console.error("Error al cargar datos:", e);
      }
      setLoading(false);
    } else {
      alert("PIN de acceso incorrecto.");
      setPin("");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-sm w-full bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center">
          <div className="text-5xl mb-6">🏛️</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">Alta Gestión</h2>
          <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest">Introduce el PIN de Acceso</p>
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-center text-3xl tracking-[0.5em] font-black text-white outline-none focus:border-emerald-500 mb-6"
          />
          <button onClick={checkPin} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all">Desbloquear Panel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-slate-900 text-white p-8 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Panel de la Dirección</h1>
            <p className="text-slate-400 text-xs mt-1 italic">Gestión de Calidad y Transparencia</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-xs bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-bold">SALIR</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <p className="text-center italic animate-pulse text-slate-500">Consultando expedientes...</p>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight ml-2">Expedientes de Voces Ciudadanas</h2>
            {tickets.map((t) => (
              <div key={t.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
                <div className={`absolute top-0 left-0 w-2 h-full ${t.type === 'GRAVE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{t.type}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">FOLIO: {t.folio}</span>
                      </div>
                      
                      <p className="text-slate-700 italic font-serif text-lg leading-relaxed">"{t.content}"</p>

                      {t.authorityResponse && (
                        <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                          <div className="flex justify-between items-center mb-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respuesta del Funcionario:</p>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.studentResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {t.studentResolved ? "✅ ALUMNO SATISFECHO" : "⏳ EN ESPERA DE VALIDACIÓN"}
                              </span>
                          </div>
                          <p className="text-sm text-slate-600 italic leading-relaxed">"{t.authorityResponse}"</p>
                          
                          {/* DISEÑO ELEGANTE DEL CLIP DE EVIDENCIA */}
                          {t.authorityEvidence && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 w-fit">
                              <span className="text-lg">📎</span>
                              <div className="flex-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Archivo Adjunto</p>
                                <p className="text-[11px] text-slate-700 font-bold">{t.authorityEvidence}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                   </div>

                   <div className="text-right ml-4">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${t.status === 'RESUELTO' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {t.status}
                      </div>
                   </div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
                <p className="text-center py-20 text-slate-400 italic">No hay reportes ciudadanos en este momento.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}