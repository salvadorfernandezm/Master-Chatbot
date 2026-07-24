"use client";
import { useState, useEffect } from "react";
import { voteProposal } from "@/lib/actions";
import Link from "next/link";

export default function MuralPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/excelencia/proposals') // Ahorita creamos esta API
      .then(res => res.json())
      .then(data => { setProposals(data); setLoading(false); });
  }, []);

  const handleVote = async (id: string) => {
    const res = await voteProposal(id);
    if (res.success) {
      setProposals(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Mural de la Excelencia</h1>
            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Propuestas validadas por la comunidad</p>
          </div>
          <Link href="/excelencia" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all">← Proponer algo</Link>
        </header>

        {loading ? <p className="animate-pulse font-black text-slate-300">CARGANDO EL ÁGORA...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{p.category}</span>
                    <span className="text-[10px] font-bold text-slate-300 italic">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-4">{p.title}</h3>
                  <p className="text-slate-600 text-sm italic leading-relaxed mb-6">"{p.content}"</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Por: {p.studentName || "Anónimo"}</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-600">{p.votes}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase leading-tight">Respaldos<br/>recibidos</span>
                  </div>
                  <button 
                    onClick={() => handleVote(p.id)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200 transition-all active:scale-95"
                  >
                    🤝 Respaldar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}