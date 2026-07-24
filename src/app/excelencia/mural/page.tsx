"use client";
import { useState, useEffect } from "react";
import { voteProposal } from "@/lib/actions";
import Link from "next/link";

export default function MuralPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/excelencia/proposals')
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Mural de la <br/><span className="text-emerald-600 italic">Excelencia</span></h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-4">Ideas que transforman nuestra Facultad</p>
          </div>
          <Link href="/excelencia" className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase hover:bg-emerald-600 transition-all shadow-2xl">
            ← Proponer mi idea
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse">
            <div className="h-12 w-12 bg-emerald-500 rounded-full mx-auto mb-4"></div>
            <p className="font-black text-slate-300 uppercase tracking-widest">Consultando el Mural...</p>
          </div>
        ) : proposals.length === 0 ? (
            <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-100 text-center">
               <p className="text-slate-300 text-2xl font-serif italic text-center w-full">El mural está esperando la primera chispa de genialidad.</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white p-10 rounded-[4rem] shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between hover:-translate-y-2 transition-all duration-500 group">
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                    <div className="flex items-center gap-1 text-slate-300 group-hover:text-emerald-500 transition-colors">
                        <span className="text-lg">✨</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                  
                  {/* TEXTO DE LA PROPUESTA */}
                  <div className="relative mb-8">
                    <span className="absolute -top-4 -left-4 text-6xl text-slate-100 font-serif opacity-50">“</span>
                    <p className="text-slate-600 text-lg font-serif italic leading-relaxed relative z-10 pl-2">
                      {p.content}
                    </p>
                  </div>
                  
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">
                    Iniciativa de: <span className="text-slate-600">{p.studentName || "Ciudadano Académico"}</span>
                  </p>
                </div>
                
                <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900 leading-none">{p.votes}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Respaldos</span>
                  </div>
                  <button 
                    onClick={() => handleVote(p.id)}
                    className="bg-emerald-500 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-emerald-100 transition-all active:scale-95"
                  >
                    🤝 Respaldar Idea
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-32 border-t border-slate-200 pt-12 pb-20 text-center">
           <div className="h-1 w-12 bg-emerald-500 mx-auto mb-6 rounded-full"></div>
           <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">La Cura de la Facultad • 2026</p>
        </footer>
      </div>
    </div>
  );
}