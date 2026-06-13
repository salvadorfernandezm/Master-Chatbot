"use client";

import { useState, useEffect } from "react";

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-sm w-full bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-5xl mb-6">🏛️</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">Alta Gestión</h2>
          <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest">Introduce el PIN de Acceso</p>
          <input 
            type="password" 
            maxLength={4} 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-center text-3xl font-black text-white outline-none mb-6" 
          />
          <button onClick={checkPin} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold uppercase text-xs">Desbloquear</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white p-8 shadow-2xl flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase text-emerald-400">Panel de Dirección</h1>
        <button onClick={() => window.location.reload()} className="text-xs bg-white/10 px-4 py-2 rounded-lg font-bold">SALIR</button>
      </header>

      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {loading ? <p className="text-center italic animate-pulse text-slate-500">Cargando...</p> : 
          tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
              <div className={`absolute top-0 left-0 w-2 h-full ${ticket.type === 'GRAVE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <div className="flex justify-between items-start text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase mr-2">{ticket.type}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">FOLIO: {ticket.folio}</span>
                  </div>
                  
                  {/* Aquí estaba el error - ticket.content ahora sí está definido */}
                  <p className="text-slate-700 italic font-serif text-lg mt-4">"{ticket.content}"</p>
                  
                  {ticket.authorityResponse && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Respuesta del Funcionario:</p>
                      <p className="text-sm text-slate-600 italic">"{ticket.authorityResponse}"</p>
                    </div>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${ticket.status === 'RESUELTO' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{ticket.status}</div>
              </div>
            </div>
          ))
        }
        {tickets.length === 0 && !loading && <p className="text-center text-slate-400 italic">No hay reportes en este momento.</p>}
      </div>
    </div>
  );
}