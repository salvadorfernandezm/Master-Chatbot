"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ImpactoPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse uppercase tracking-[0.3em]">Analizando Rendición de Cuentas...</div>;

  const { resumen, autoridades, settings } = data;

  // Lógica inteligente para el botón volver
  const backUrl = session ? "/admin" : "/admin/directora";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Monitor de Impacto</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Transparencia y Eficiencia Institucional</p>
          </div>
          <Link href={backUrl} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg">
             ← Volver al Panel
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="Apelaciones" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="No Atendidos" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-8 border-l-8 border-emerald-500 pl-4">Eficiencia por Responsable</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
              <ProgressBar label="Secretaría Académica" name={settings?.nameAcademica} stats={autoridades.academica} total={resumen.total} color="bg-purple-500" />
              <ProgressBar label="Secretaría Administrativa" name={settings?.nameAdministrativa} stats={autoridades.logistica} total={resumen.total} color="bg-blue-500" />
              <ProgressBar label="Dirección General" name={settings?.nameDireccion} stats={autoridades.direccion} total={resumen.total} color="bg-amber-500" />
              <ProgressBar label="Soporte Técnico" name={settings?.nameTecnico} stats={{resueltos: autoridades.tecnico, apelados:0, noAtendidos:0}} total={resumen.total} color="bg-slate-500" />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, text = "text-white", animate = "" }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] shadow-xl`}>
      <p className="text-[10px] font-black uppercase opacity-60 text-white mb-2 tracking-widest">{title}</p>
      <p className={`text-5xl font-black ${text} ${animate}`}>{value}</p>
    </div>
  );
}

function ProgressBar({ label, name, stats, total, color }: any) {
  const percentage = total > 0 ? Math.round((stats.resueltos / total) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{label}</span>
          <span className="text-[14px] font-black text-slate-800 block leading-tight">{name || "Sin asignar"}</span>
        </div>
        <div className="text-right">
            <span className="text-xl font-black text-slate-900">{percentage}%</span>
            <div className="flex gap-2 mt-1">
                {stats.apelados > 0 && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ {stats.apelados} Apelado(s)</span>}
                {stats.noAtendidos > 0 && <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded-full">⌛ {stats.noAtendidos} Retraso(s)</span>}
            </div>
        </div>
      </div>
      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}