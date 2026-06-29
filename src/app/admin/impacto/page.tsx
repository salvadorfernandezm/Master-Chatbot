"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ImpactoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => console.error("Error:", err));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse">GENERANDO REPORTE DE IMPACTO...</div>;

  const { resumen, autoridades } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Monitor de Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Análisis de transparencia y eficiencia</p>
          </div>
          <div className="flex gap-3">
             <Link href="/admin/directora" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg">Ver Expedientes</Link>
             <Link href="/buzon" className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all">Portal</Link>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Recibidos" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Casos Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="Apelaciones" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="No Atendidos" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-8 border-l-8 border-emerald-500 pl-4 text-slate-800">Eficiencia por Responsable</h2>
            <div className="space-y-10">
              <ProgressBar 
                label="Secretaría Académica" 
                name="MTFP Adrián Pascual Guadiana González"
                value={autoridades.academica} total={resumen.total} color="bg-purple-500" 
              />
              <ProgressBar 
                label="Secretaría Administrativa" 
                name="Mtro. Guillermo Ibrahim González López"
                value={autoridades.logistica} total={resumen.total} color="bg-blue-500" 
              />
              <ProgressBar 
                label="Dirección General" 
                name="Dra. Sagrario Lizeth Salas Name"
                value={autoridades.direccion} total={resumen.total} color="bg-amber-500" 
              />
              <ProgressBar 
                label="Soporte Técnico" 
                name="Dr. Salvador Fernández Martínez"
                value={autoridades.tecnico} total={resumen.total} color="bg-slate-500" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl h-full flex flex-col justify-center">
               <div className="absolute -top-10 -right-10 opacity-10 text-[15rem] rotate-12">⚖️</div>
               <h3 className="text-3xl font-black uppercase mb-6 leading-none">Cultura de la Responsabilidad</h3>
               <p className="text-emerald-100 text-lg leading-relaxed italic font-serif">
                 "La transparencia es el motor del cambio. Este tablero visibiliza el compromiso individual con la justicia institucional."
               </p>
            </div>
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

function ProgressBar({ label, name, value, total, color }: any) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[11px] font-black uppercase tracking-tight text-slate-500 block">{label}</span>
          <span className="text-[13px] font-bold text-slate-800">{name}</span>
        </div>
        <span className="text-[10px] font-black text-slate-400">{value} Resueltos ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-100 h-6 rounded-2xl overflow-hidden shadow-inner p-1">
        <div 
          className={`${color} h-full rounded-xl transition-all duration-1000 ease-out shadow-lg`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}