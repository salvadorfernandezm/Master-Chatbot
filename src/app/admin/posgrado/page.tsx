"use client";
import { useState, useEffect } from "react";
import { verifyPosgradoPin } from "@/lib/actions";
import Link from "next/link";

export default function PosgradoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const auth = localStorage.getItem("posgrado_authenticated");
    if (auth === "true") {
      setAuthorized(true);
      fetchData();
    } else {
      setAuthorized(false);
      setLoading(false);
    }
    // Cargamos settings para el logo institucional
    fetch('/api/admin/stats-buzon').then(res => res.json()).then(d => setSettings(d.settings));
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/buzon/posgrado') // Esta API ya filtra solo "Posgrado"
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); })
      .catch(err => setLoading(false));
  };

  const handleVerify = async () => {
    const ok = await verifyPosgradoPin(pin);
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

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return "📄 PDF";
    return "🖼️ Imagen";
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans text-center">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] border-b-8 border-indigo-500 shadow-2xl">
          <div className="bg-white p-4 rounded-2xl mb-6 inline-block shadow-inner">
            {settings?.organizationLogo && <img src={settings.organizationLogo} alt="Logo" className="h-12 object-contain" />}
          </div>
          <h1 className="text-2xl font-black uppercase mb-2 tracking-widest text-indigo-400">Jefatura de Posgrado</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-8 tracking-widest font-sans">Acceso Restringido</p>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Introduce el PIN" className="w-full bg-black border-2 border-slate-800 p-5 rounded-2xl mb-4 text-center text-xl text-white outline-none focus:border-indigo-500" />
          <button onClick={handleVerify} className="w-full bg-indigo-600 p-5 rounded-2xl font-black uppercase hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">Entrar al Despacho</button>
          <div className="mt-8">
            <Link href="/buzon" className="text-slate-500 text-xs font-bold uppercase hover:text-white transition-all">← Volver al Portal</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left text-slate-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
              {settings?.organizationLogo && <img src={settings.organizationLogo} alt="Logo" className="h-8 object-contain" />}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-indigo-400">Panel de Posgrado</h1>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">División de Estudios e Investigación</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-red-500/20">Cerrar Sesión</button>
        </header>

        {/* NAVEGACIÓN TRIDENTE (PUNTO 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link href="/admin/impacto?from=director" className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-emerald-500 transition-all shadow-sm">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-slate-400">Rendición</p>
              <h3 className="text-xl font-black uppercase text-slate-600 group-hover:text-emerald-600">Impacto</h3>
            </div>
            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">📊</span>
          </Link>

          <Link href="/excelencia/mural" className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500 transition-all shadow-sm">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-slate-400">Propuestas</p>
              <h3 className="text-xl font-black uppercase text-slate-600 group-hover:text-blue-600">Mural</h3>
            </div>
            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">💡</span>
          </Link>
          
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase opacity-60">Viendo tus:</p>
              <h3 className="text-xl font-black uppercase">Expedientes</h3>
            </div>
            <span className="text-4xl">📂</span>
          </div>
        </div>

        <div className="space-y-8 text-left">
          {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-300 uppercase">Localizando expedientes de posgrado...</p> : 
            tickets.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
                 <p className="text-slate-300 text-xl italic font-serif">No se han recibido reportes para Posgrado.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-left">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{t.academicProgram}</span>
                        <span className="text-slate-300">Folio: {t.folio}</span>
                      </div>
                      <h2 className="text-xl font-black underline decoration-indigo-200 underline-offset-4 text-left font-sans">Reportante: {t.studentName}</h2>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm text-left">"{t.content}"</div>
                      
                      {t.authorityResponse && (
                        <div className={`mt-4 p-6 rounded-2xl border-2 ${t.status === 'APELADO' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                          <p className={`text-[9px] font-black uppercase mb-2 ${t.status === 'APELADO' ? 'text-red-600' : 'text-indigo-600'}`}>
                            {t.status === 'APELADO' ? '🚨 Apelación en curso:' : '✅ Respuesta enviada:'}
                          </p>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap">{t.authorityResponse}</p>
                        </div>
                      )}
                    </div>
                    <div className="md:w-40 text-right">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl inline-block ${
                        t.status === 'PENDIENTE' ? 'bg-amber-500 text-white animate-pulse' : 
                        t.status === 'APELADO' ? 'bg-red-600 text-white animate-bounce' : 
                        t.status === 'NO ATENDIDO EN TIEMPO' ? 'bg-black text-red-500 border-2 border-red-500 animate-pulse' : 
                        'bg-indigo-600 text-white'
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