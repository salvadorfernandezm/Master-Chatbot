"use client";
import { useState, useEffect } from "react";
import { updateProposalStatus } from "@/lib/actions";

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/all-proposals')
      .then(res => res.json())
      .then(d => { 
        // Si viewArchived es true, mostramos solo las archivadas
        const filtered = viewArchived 
          ? d.filter((p:any) => p.status === 'ARCHIVADA')
          : d.filter((p:any) => p.status !== 'ARCHIVADA');
        setProposals(filtered); 
        setLoading(false); 
      });
  };

  useEffect(() => { load(); }, [viewArchived]);

  const handleAction = async (id: string, status: string) => {
    await updateProposalStatus(id, status);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center border-b-8 border-emerald-500">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-emerald-400">
              {viewArchived ? "Sótano de Ideas" : "Moderación de Excelencia"}
            </h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">
              {viewArchived ? "Propuestas fuera del mural" : "Filtro de Innovación Académica"}
            </p>
          </div>
          <button 
            onClick={() => setViewArchived(!viewArchived)}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] transition-all ${viewArchived ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
          >
            {viewArchived ? "← Volver a Activas" : "📁 Ver Archivadas"}
          </button>
        </header>

        <div className="space-y-8">
          {loading ? <p className="text-center py-20 animate-pulse font-black text-slate-300">ABRIENDO EXPEDIENTES...</p> : 
            proposals.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                    <p className="text-slate-300 font-serif italic text-xl">No hay propuestas en esta sección.</p>
                </div>
            ) :
            proposals.map(p => (
              <div key={p.id} className={`bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden transition-all ${p.status === 'ARCHIVADA' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'APROBADA' ? 'bg-emerald-100 text-emerald-700' : 
                        p.status === 'ARCHIVADA' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 mt-4 tracking-tight">{p.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'APROBADA' && (
                      <button onClick={() => handleAction(p.id, "APROBADA")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all active:scale-95">
                        {p.status === 'ARCHIVADA' ? "Restaurar y Publicar" : "Aprobar y Publicar"}
                      </button>
                    )}
                    {p.status !== 'ARCHIVADA' && (
                        <button onClick={() => handleAction(p.id, "ARCHIVADA")} className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all">
                        Archivar
                        </button>
                    )}
                  </div>
                </div>

                {/* LA PROPUESTA REAL DEL ALUMNO (Aseguramos que se vea) */}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-6 shadow-inner">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 tracking-widest">Propuesta del Estudiante:</p>
                  <p className="text-lg text-slate-700 leading-relaxed font-serif italic">
                    {p.content || "Sin contenido registrado"}
                  </p>
                </div>

                {/* DICTAMEN DE SÓCRATES */}
                <div className="bg-emerald-900/5 p-6 rounded-3xl border border-emerald-500/10 flex items-start gap-4">
                   <span className="text-2xl">🦉</span>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sello de Calidad Socrática:</p>
                     <p className="text-xs text-slate-600 font-bold">{p.aiFeedback || "Validación estándar del Agente"}</p>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase flex flex-wrap gap-6">
                  <span>👤 Autor: {p.studentName || "Anónimo"}</span>
                  <span>📁 Categoría: {p.category}</span>
                  <span>📅 Recibida: {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>🤝 Respaldos: {p.votes}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}