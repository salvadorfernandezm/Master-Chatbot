"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PublicImpactoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  if (loading || !data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse">CARGANDO MÉTRICAS PÚBLICAS...</div>;

  const { resumen, autoridades, settings } = data;
  const globalEfficiency = resumen.total > 0 ? Math.round((resumen.resueltos / resumen.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Portal de Transparencia Pública - Voz Ética</p>
          </div>
          <Link href="/buzon" className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg">← Volver al Portal</Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Reportes" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Solucionados" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="En Proceso" value={resumen.pendientes + resumen.apelados} color="bg-amber-500" />
          <StatCard title="Eficiencia" value={`${globalEfficiency}%`} color="bg-slate-800" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-10 border-l-8 border-emerald-500 pl-4 text-slate-800">Desempeño por Responsable</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
              <DetailBar label="Secretaría Académica" name={settings?.nameAcademica} stats={autoridades.academica} color="bg-purple-500" />
              <DetailBar label="Secretaría Administrativa" name={settings?.nameAdministrativa} stats={autoridades.logistica} color="bg-blue-500" />
              <DetailBar label="Dirección General" name={settings?.nameDireccion} stats={autoridades.direccion} color="bg-amber-500" />
              <DetailBar label="Soporte Técnico" name={settings?.nameTecnico} stats={{recibidos: autoridades.tecnico, resueltos: autoridades.tecnico}} color="bg-slate-500" />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] shadow-xl`}>
      <p className="text-[10px] font-black uppercase opacity-60 text-white mb-2">{title}</p>
      <p className="text-5xl font-black text-white">{value}</p>
    </div>
  );
}

function DetailBar({ label, name, stats, color }: any) {
  const efficiency = stats?.recibidos > 0 ? Math.round((stats.resueltos / stats.recibidos) * 100) : 0;
  return (
    <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">{label}</span>
          <span className="text-[14px] font-black text-slate-800 block leading-tight">{name || "Pendiente"}</span>
        </div>
        <div className="text-right">
            <span className="text-2xl font-black text-slate-900">{efficiency}%</span>
            <p className="text-[8px] font-bold uppercase text-slate-400">Eficiencia</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white p-2 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase">Recibidos</p>
              <p className="text-sm font-black text-slate-700">{stats?.recibidos || 0}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-emerald-400 uppercase">Resueltos</p>
              <p className="text-sm font-black text-emerald-600">{stats?.resueltos || 0}</p>
          </div>
      </div>
      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${efficiency}%` }}></div>
      </div>
    </div>
  );
}