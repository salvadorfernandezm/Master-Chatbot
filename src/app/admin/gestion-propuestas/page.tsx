"use client";
import { useState, useEffect } from "react";
import { updateProposalStatus } from "@/lib/actions"; // Ahorita añadimos esta función

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/all-proposals') // Ocuparemos una API que traiga TODO
      .then(res => res.json())
      .then(d => { setProposals(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, status: string) => {
    // Necesitaremos añadir esta función en actions.ts
    const { updateProposalStatus } = await import("@/lib/actions");
    await updateProposalStatus(id, status);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-emerald-400">Moderación de Propuestas</h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Iniciativa de Excelencia</p>
          </div>
          <div className="text-2xl font-black bg-white/10 w-12 h-12 rounded-full flex items-center justify-center">{proposals.length}</div>
        </header>

        <div className="space-y-6">
          {loading ? <p className="animate-pulse">Cargando propuestas...</p> : 
            proposals.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'APROBADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                    <h3 className="text-xl font-black text-slate-800 mt-2">{p.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'APROBADA' && <button onClick={() => handleAction(p.id, "APROBADA")} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Aprobar y Publicar</button>}
                    <button onClick={() => handleAction(p.id, "ARCHIVADA")} className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Archivar</button>
                  </div>
                </div>
                <p className="text-slate-600 italic mb-4">"{p.content}"</p>
                <div className="text-[10px] font-bold text-slate-400 uppercase flex gap-4">
                  <span>Por: {p.studentName}</span>
                  <span>Categoría: {p.category}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}