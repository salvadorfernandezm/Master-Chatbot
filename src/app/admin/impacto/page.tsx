"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function ImpactoPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backUrl, setBackUrl] = useState("/buzon");

  useEffect(() => {
    // LÓGICA DE NAVEGACIÓN LEAL (Detectamos procedencia por URL)
    const fromParam = searchParams.get("from");
    const isPublic = window.location.pathname.includes("/buzon/impacto");

    if (fromParam === "posgrado") {
      setBackUrl("/admin/posgrado"); // Si viene de posgrado, vuelve allá
    } else if (fromParam === "director") {
      setBackUrl("/admin/directora"); // Si viene de la dire, vuelve allá
    } else if (session) {
      setBackUrl("/admin"); // Si eres tú como Admin Maestro
    }

    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => console.error(err));
  }, [session, searchParams]);

  if (loading || !data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse uppercase">Sincronizando con el Ágora...</div>;

  const { resumen, autoridades, settings } = data;
  const isPublic = window.location.pathname.includes("/buzon/impacto");

  // Calculamos el máximo para las barras
  const maxRecibidos = Math.max(
    autoridades.academica.recibidos,
    autoridades.logistica.recibidos,
    autoridades.posgrado.recibidos,
    autoridades.direccion.recibidos,
    1
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500 gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1 italic">Métricas de Transparencia</p>
          </div>
          {!isPublic && (
            <Link href={backUrl} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">
               ← Volver al Panel
            </Link>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="Apelados" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="Retrasos" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-10 border-l-8 border-red-500 pl-4">Carga de Trabajo y Eficiencia</h2>
            <div className="space-y-12">
              <VolumeBar label="Gestión Académica" name={settings?.nameAcademica} stats={autoridades.academica} max={maxRecibidos} color="bg-purple-500" />
              <VolumeBar label="Gestión Administrativa" name={settings?.nameAdministrativa} stats={autoridades.logistica} max={maxRecibidos} color="bg-blue-500" />
              <VolumeBar label="Jefatura de Posgrado" name="División de Estudios" stats={autoridades.posgrado} max={maxRecibidos} color="bg-indigo-600" />
              <VolumeBar label="Dirección General" name={settings?.nameDireccion} stats={autoridades.direccion} max={maxRecibidos} color="bg-amber-500" />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, text = "text-white", animate = "" }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] shadow-xl`}>
      <p className="text-[10px] font-black uppercase opacity-60 text-white mb-2">{title}</p>
      <p className={`text-5xl font-black ${text} ${animate}`}>{value}</p>
    </div>
  );
}

function VolumeBar({ label, name, stats, max, color }: any) {
  const efficiency = stats.recibidos > 0 ? Math.round((stats.resueltos / stats.recibidos) * 100) : 0;
  const containerWidth = (stats.recibidos / max) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase text-red-600 block">{label}</span>
          <span className="text-lg font-black text-black leading-tight">{name || "Pendiente"}</span>
        </div>
        <div className="text-right">
            <span className="text-3xl font-black text-black">{efficiency}%</span>
            <p className="text-[8px] font-black uppercase text-slate-500">Eficiencia Real</p>
        </div>
      </div>
      <div style={{ width: `${containerWidth}%`, minWidth: '150px' }} className="transition-all duration-1000">
        <div className="h-10 w-full bg-red-100 rounded-2xl overflow-hidden shadow-inner flex relative border-2 border-red-200">
            <div className={`${color} h-full transition-all duration-1000 flex items-center justify-center text-white text-xs font-black`} style={{ width: `${efficiency}%` }}>
              {stats.resueltos > 0 && `✓ ${stats.resueltos}`}
            </div>
            <div className="flex-1 flex items-center justify-center text-red-700 text-xs font-black">
              { (stats.recibidos - stats.resueltos) > 0 && `⋯ ${stats.recibidos - stats.resueltos}` }
            </div>
        </div>
      </div>
    </div>
  );
}