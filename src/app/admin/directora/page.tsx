"use client";

import { useState, useEffect } from "react";
import { updateTicketStatus } from "@/app/actions/admin"; // Asegúrate de que esta función exista en admin.ts
// Usaremos una versión simplificada para la consulta de datos para evitar líos de servidor/cliente
export default function DirectorPanelPage() {
  const [pin, setPin] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Validar el PIN (puedes cambiarlo aquí o usar el .env en el futuro)
  // Para máxima facilidad hoy, el PIN es 1234
  const checkPin = () => {
    if (pin === "1234") {
      setIsAuthorized(true);
      fetchTickets();
    } else {
      alert("PIN incorrecto. Acceso denegado.");
      setPin("");
    }
  };

  async function fetchTickets() {
    try {
      const res = await fetch('/api/buzon/directora'); // Crearemos esta ruta rápida
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // PANTALLA DE BLOQUEO
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-sm w-full bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center">
          <div className="text-5xl mb-6">🔐</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 text-xs mb-8">Introduce el PIN de Alta Gestión</p>
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-center text-3xl tracking-[1em] font-black text-white outline-none focus:border-emerald-500 mb-6"
          />
          <button 
            onClick={checkPin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
          >
            Entrar al Despacho
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA DEL PANEL (Tu diseño hermoso de ayer)
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-slate-900 text-white p-8 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Panel de Alta Gestión</h1>
            <p className="text-slate-400 text-xs mt-1 italic">"Transparencia y Calidad Institucional"</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-xs opacity-50 hover:opacity-100 uppercase font-bold tracking-widest">Salir</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8 space-y-10">
        {loading ? (
          <p className="text-center italic text-slate-400">Cargando expedientes...</p>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-tight ml-2">Expedientes de Voces Ciudadanas</h2>
            {tickets.map((t) => (
              <div key={t.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full ${t.type === 'GRAVE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div className="flex justify-between items-start">
                   <div>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black mr-3">{t.type}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Folio: {t.folio}</span>
                      <p className="mt-4 text-slate-700 italic font-serif text-lg leading-relaxed">"{t.content}"</p>
                   </div>
                   <div className="text-right">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${t.status === 'RESUELTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.status}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}