"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ImpactoPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDirector, setIsDirector] = useState(false);

  useEffect(() => {
    // Verificamos de forma estricta si es directora
    const auth = localStorage.getItem("director_authenticated");
    setIsDirector(auth === "true");

    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse uppercase">Cargando Monitor de Impacto...</div>;

  const { resumen, autoridades, settings } = data;

  // EL BOTÓN TRAICIONERO AHORA ES LEAL:
  // Si hay sesión de NextAuth, eres TÚ (Admin). Si hay localStorage, es la DIRE.
  const backUrl = session ? "/admin" : (isDirector ? "/admin/directora" : "/buzon");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Control Ético y Transparencia</p>
          </div>
          <Link href={backUrl} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">
             ← Volver al Panel
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="Apelados" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="No Atendidos" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-10 border-l-8 border-emerald-500 pl-4">Cumplimiento por Responsable</h2>
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

function StatCard({ title, value, color, text = "text-white", animate = "" }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
      <p className="text-[10px] font-black uppercase opacity-60 text-white mb-2">{title}</p>
      <p className={`text-5xl font-black ${text} ${animate}`}>{value}</p>
    </div>
  );
}

function DetailBar({ label, name, stats, color }: any) {
  const efficiency = stats?.recibidos > 0 ? Math.round((stats.resueltos / stats.recibidos) * 100) : 0;
  return (
    <div className="space-y-4 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{label}</span>
          <span className="text-[15px] font-black text-slate-800 block leading-tight">{name || "Pendiente"}</span>
        </div>
        <div className="text-right">
            <span className="text-2xl font-black text-slate-900">{efficiency}%</span>
            <p className="text-[8px] font-bold uppercase text-slate-400">Eficiencia</p>
        </div>
      </div>
      
      {/* EL COMPARATIVO DE BARRAS (PUNTO 2) */}
      <div className="grid grid-cols-2 gap-3 text-center mb-2">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Recibidos</p>
              <p className="text-xl font-black text-slate-800">{stats?.recibidos || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Resueltos</p>
              <p className="text-xl font-black text-emerald-600">{stats?.resueltos || 0}</p>
          </div>
      </div>

      <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden shadow-inner">
        <div className={`${color} h-full transition-all duration-1000 ease-out`} style={{ width: `${efficiency}%` }}></div>
      </div>

      {(stats?.apelados > 0 || stats?.noAtendidos > 0) && (
        <div className="flex gap-2 pt-2">
          {stats.apelados > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase">⚠️ {stats.apelados} Apelaciones</span>}
          {stats.noAtendidos > 0 && <span className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded-full uppercase">⌛ {stats.noAtendidos} Retrasos</span>}
        </div>
      )}
    </div>
  );
}