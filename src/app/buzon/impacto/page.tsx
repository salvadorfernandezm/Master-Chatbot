"use client";
import { useState, useEffect } from "react";

export default function PublicImpactoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black">CONSULTANDO DATOS PÚBLICOS...</div>;

  const { resumen, autoridades, settings } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Portal de Transparencia Pública</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-lg">
            <p className="text-[10px] font-black uppercase opacity-60">Total Reportes</p>
            <p className="text-5xl font-black">{resumen.total}</p>
          </div>
          <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-lg">
            <p className="text-[10px] font-black uppercase opacity-60">Resueltos</p>
            <p className="text-5xl font-black">{resumen.resueltos}</p>
          </div>
          <div className="bg-slate-300 p-8 rounded-[2rem] text-slate-700 shadow-lg">
            <p className="text-[10px] font-black uppercase opacity-60">En Proceso</p>
            <p className="text-5xl font-black">{resumen.pendientes + resumen.apelados}</p>
          </div>
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2rem] text-slate-400 shadow-lg">
            <p className="text-[10px] font-black uppercase">Eficiencia</p>
            <p className="text-5xl font-black text-slate-800">{resumen.total > 0 ? Math.round((resumen.resueltos/resumen.total)*100) : 0}%</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-8 border-l-8 border-emerald-500 pl-4">Cumplimiento por Área</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <ProgressItem label={settings?.nameAcademica} value={autoridades.academica} total={resumen.total} color="bg-purple-500" />
              <ProgressItem label={settings?.nameAdministrativa} value={autoridades.logistica} total={resumen.total} color="bg-blue-500" />
              <ProgressItem label={settings?.nameDireccion} value={autoridades.direccion} total={resumen.total} color="bg-amber-500" />
              <ProgressItem label={settings?.nameTecnico} value={autoridades.tecnico} total={resumen.total} color="bg-slate-500" />
            </div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ label, value, total, color }: any) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-black uppercase text-slate-500">
        <span>{label || 'Área'}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}