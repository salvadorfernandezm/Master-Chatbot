"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PublicImpactoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse">GENERANDO REPORTE PÚBLICO...</div>;

  const { resumen, autoridades, settings } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Portal de Transparencia Universitaria</p>
          </div>
          <Link href="/buzon" className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg">← Volver al Buzón</Link>
        </header>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 mb-8">
            <h2 className="text-xl font-black uppercase mb-8 border-l-8 border-emerald-500 pl-4">Estado de Respuesta por Área</h2>
            <div className="space-y-12">
              <PublicCompare label="Gestión Académica" stats={autoridades.academica} color="bg-purple-500" />
              <PublicCompare label="Gestión Administrativa" stats={autoridades.logistica} color="bg-blue-500" />
              <PublicCompare label="Dirección General" stats={autoridades.direccion} color="bg-amber-500" />
            </div>
        </div>

        <div className="bg-emerald-900 p-10 rounded-[3rem] text-white text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 p-10 opacity-10 text-9xl">⚖️</div>
             <p className="text-lg font-serif italic mb-2">"La transparencia no es una opción, es el compromiso de nuestra institución con cada voz que se levanta."</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Rendición de Cuentas en Tiempo Real</p>
        </div>
      </div>
    </div>
  );
}

function PublicCompare({ label, stats, color }: any) {
  const percentage = stats.recibidos > 0 ? Math.round((stats.resueltos / stats.recibidos) * 100) : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-xs font-black uppercase text-slate-500 tracking-widest">{label}</span>
        <span className="text-xs font-bold text-slate-400">{percentage}% Atendido</span>
      </div>
      
      <div className="flex gap-1 h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-1">
        {/* BARRA DE RESUELTOS */}
        <div 
          className={`${color} h-full rounded-xl transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white`}
          style={{ width: `${percentage}%`, minWidth: stats.resueltos > 0 ? '40px' : '0' }}
        >
          {stats.resueltos > 0 && `✓ ${stats.resueltos}`}
        </div>
        {/* BARRA DE PENDIENTES */}
        <div 
          className="bg-slate-300 h-full rounded-xl transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-slate-500"
          style={{ width: `${100 - percentage}%`, minWidth: (stats.recibidos - stats.resueltos) > 0 ? '40px' : '0' }}
        >
          { (stats.recibidos - stats.resueltos) > 0 && `⋯ ${stats.recibidos - stats.resueltos}`}
        </div>
      </div>
      <p className="text-[9px] text-slate-400 uppercase font-bold italic">Se han recibido {stats.recibidos} reportes en total para esta área.</p>
    </div>
  );
}