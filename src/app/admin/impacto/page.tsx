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

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse uppercase">Generando Radiografía...</div>;

  const { resumen, autoridades, settings } = data;
  const isPublic = window.location.pathname.includes("/buzon/impacto");
  
  // LÓGICA DE BOTÓN LEAL: Si la URL dice que vienes de la dire, regresas con ella.
  const fromDirector = searchParams.get("from") === "director";
  const backUrl = fromDirector ? "/admin/directora" : (session ? "/admin" : "/buzon");

  // Calculamos el máximo de recibidos para escalar las barras (Punto 5)
  const maxRecibidos = Math.max(
    autoridades.academica.recibidos,
    autoridades.logistica.recibidos,
    autoridades.direccion.recibidos,
    autoridades.tecnico || 0,
    1 // Evitar división por cero
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border-b-8 border-emerald-500">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Impacto Institucional</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1 italic">Métricas Proporcionales de Respuesta</p>
          </div>
          {!isPublic && (
            <Link href={backUrl} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg">
               ← Volver al Panel
            </Link>
          )}
        </header>

        {/* TARJETAS SUPERIORES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total" value={resumen.total} color="bg-blue-600" />
          <StatCard title="Resueltos" value={resumen.resueltos} color="bg-emerald-600" />
          <StatCard title="En Apelación" value={resumen.apelados} color="bg-red-600" animate={resumen.apelados > 0 ? "animate-bounce" : ""} />
          <StatCard title="Sin Atención" value={resumen.noAtendidos} color="bg-black" text="text-red-500" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-xl font-black uppercase mb-10 border-l-8 border-red-500 pl-4 text-slate-900">Carga de Trabajo y Eficiencia</h2>
            <div className="space-y-12">
  <VolumeBar label="Gestión Académica" name={settings?.nameAcademica} stats={autoridades.academica} max={maxRecibidos} />
  <VolumeBar label="Gestión Administrativa" name={settings?.nameAdministrativa} stats={autoridades.logistica} max={maxRecibidos} />
  <VolumeBar label="Posgrado e Investigación" name="Jefatura de Posgrado" stats={autoridades.posgrado} max={maxRecibidos} />
  <VolumeBar label="Dirección General" name={settings?.nameDireccion} stats={autoridades.direccion} max={maxRecibidos} />
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

// COMPONENTE DE BARRA PROPORCIONAL (PUNTOS 2, 4 Y 5)
function VolumeBar({ label, name, stats, max }: any) {
  const efficiency = stats.recibidos > 0 ? Math.round((stats.resueltos / stats.recibidos) * 100) : 0;
  // El ancho del contenedor depende de cuántos recibió comparado con el máximo de la escuela
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
            <p className="text-[9px] font-black uppercase text-slate-500">Eficiencia Real</p>
        </div>
      </div>
      
      {/* BARRA DE VOLUMEN PROPORCIONAL */}
      <div style={{ width: `${containerWidth}%`, minWidth: '150px' }} className="transition-all duration-1000">
        <div className="h-10 w-full bg-red-100 rounded-2xl overflow-hidden shadow-inner flex relative border-2 border-red-200">
            {/* PARTE RESUELTA (VERDE) */}
            <div 
              className="bg-emerald-500 h-full transition-all duration-1000 flex items-center justify-center text-white text-xs font-black shadow-[4px_0_10px_rgba(0,0,0,0.1)] z-10"
              style={{ width: `${efficiency}%` }}
            >
              {stats.resueltos > 0 && `✓ ${stats.resueltos}`}
            </div>
            {/* PARTE PENDIENTE (ROJA/Gris oscuro) */}
            <div className="flex-1 flex items-center justify-center text-red-700 text-xs font-black">
              { (stats.recibidos - stats.resueltos) > 0 && `⋯ ${stats.recibidos - stats.resueltos}` }
            </div>
        </div>
      </div>
      <p className="text-[11px] text-black font-bold">
        Esta área ha recibido <span className="text-red-600 text-sm font-black">{stats.recibidos} reportes</span> en total.
      </p>
    </div>
  );
}