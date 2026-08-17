"use client";
import { useState, useEffect } from "react";
import { verifyPosgradoPin } from "@/lib/actions"; // Importamos la llave correcta
import Link from "next/link";

export default function PosgradoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Usamos una llave diferente en el navegador para que no choque con la Dire
    const auth = localStorage.getItem("posgrado_authenticated");
    if (auth === "true") {
      setAuthorized(true);
      fetchData();
    } else {
      setAuthorized(false);
      setLoading(false);
    }
    fetch('/api/admin/stats-buzon').then(res => res.json()).then(d => setSettings(d.settings));
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/buzon/posgrado') // La API que solo trae Posgrado
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const handleVerify = async () => {
    const ok = await verifyPosgradoPin(pin); // Usamos la función de Posgrado
    if (ok) {
      localStorage.setItem("posgrado_authenticated", "true");
      setAuthorized(true);
      fetchData();
    } else alert("PIN de Posgrado Incorrecto");
  };

  const handleLogout = () => {
    localStorage.removeItem("posgrado_authenticated");
    setAuthorized(false);
    window.location.reload();
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans text-center">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] border-b-8 border-indigo-500 shadow-2xl">
          <div className="bg-white p-4 rounded-2xl mb-6 inline-block shadow-inner">
            {settings?.organizationLogo && <img src={settings.organizationLogo} alt="Logo" className="h-12 object-contain" />}
          </div>
          <h1 className="text-2xl font-black uppercase mb-2 tracking-widest text-indigo-400">Jefatura de Posgrado</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-8">Acceso Exclusivo</p>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="PIN de Posgrado" 
            className="w-full bg-black border-2 border-slate-800 p-5 rounded-2xl mb-4 text-center text-xl text-white outline-none focus:border-indigo-500" 
          />
          <button onClick={handleVerify} className="w-full bg-indigo-600 p-5 rounded-2xl font-black uppercase hover:bg-indigo-500 transition-all shadow-lg">Entrar al Panel</button>
          <div className="mt-8">
            <Link href="/buzon" className="text-slate-500 text-xs font-bold uppercase hover:text-white transition-all">← Volver al Portal</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left text-slate-800 text-left">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
              {settings?.organizationLogo && <img src={settings.organizationLogo} alt="Logo" className="h-8 object-contain" />}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-indigo-400">Panel de Posgrado</h1>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Gestión de Maestrías</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-red-500/20">Salir</button>
        </header>

        <div className="space-y-8">
          {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-300 uppercase">Cargando expedientes de posgrado...</p> : 
            tickets.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
                 <p className="text-slate-300 text-xl italic font-serif">No hay reportes de Posgrado pendientes.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{t.category || 'POSGRADO'}</span>
                        <span className="text-slate-300">Folio: {t.folio}</span>
                      </div>
                      <h2 className="text-xl font-black underline decoration-indigo-200 underline-offset-4">Reportante: {t.studentName}</h2>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">"{t.content}"</div>
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
            )
          }
        </div>
      </div>
    </div>
  );
}