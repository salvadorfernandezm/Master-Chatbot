"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ImpactoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apuntamos a la nueva dirección de la API
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => console.error("Error:", err));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500 font-sans">
      <div className="text-4xl mb-4 animate-spin">📊</div>
      <p className="font-black uppercase tracking-[0.3em]">Procesando métricas de transparencia...</p>
    </div>
  );

  const { resumen, autoridades } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Monitor de Impacto Institucional
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Transparencia en tiempo real - Voz Ética</p>
          </div>
          <Link href="/buzon" className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-lg active:scale-95">
            Volver al Portal
          </Link>
        </header>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Recibidos" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Casos Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="Apelaciones" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="No Atendidos" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* EFICIENCIA POR RESPONSABLE */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black uppercase mb-8 border-l-8 border-emerald-500 pl-4 text-slate-800">Eficiencia por Responsable</h2>
              <div className="space-y-8">
                <ProgressBar label="Secretaría Académica" value={autoridades.academica} total={resumen.total} color="bg-purple-500" />
                <ProgressBar label="Secretaría Administrativa" value={autoridades.logistica} total={resumen.total} color="bg-blue-500" />
                <ProgressBar label="Dirección General" value={autoridades.direccion} total={resumen.total} color="bg-amber-500" />
                <ProgressBar label="Soporte Técnico" value={autoridades.tecnico} total={resumen.total} color="bg-slate-500" />
              </div>
            </div>
          </div>

          {/* CUADRO DE HONOR / FILOSOFÍA */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl flex flex-col justify-center">
             <div className="absolute -top-10 -right-10 opacity-10 text-[15rem] rotate-12">⚖️</div>
             <h3 className="text-3xl font-black uppercase mb-6 leading-none">Cultura de la <br/>Responsabilidad</h3>
             <p className="text-emerald-100 text-lg leading-relaxed italic font-serif">
               "Los datos no mienten. Cada barra representa la velocidad con la que nuestra institución escucha y sana las inquietudes de su comunidad."
             </p>
             <div className="mt-10 h-1 w-20 bg-emerald-400 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, text = "text-white", animate = "" }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
      <p className="text-[10px] font-black uppercase opacity-60 text-white mb-2 tracking-widest">{title}</p>
      <p className={`text-5xl font-black ${text} ${animate}`}>{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-black uppercase tracking-tight text-slate-500">{label}</span>
        <span className="text-[10px] font-bold text-slate-400">{value} Resueltos ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-100 h-5 rounded-2xl overflow-hidden shadow-inner p-1">
        <div 
          className={`${color} h-full rounded-xl transition-all duration-1000 ease-out shadow-lg`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}