import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const settings = await prisma.settings.findFirst();
  const orgName = settings?.organizationName || "Master Chatbot IA";
  const orgLogo = settings?.organizationLogo;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orgLogo ? (
              <img src={orgLogo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold transform rotate-6 hover:rotate-0 transition-transform cursor-pointer">
                M
              </div>
            )}
            <span className="text-xl font-black text-slate-800 tracking-tight italic">
              {orgName.toUpperCase()}
            </span>
          </div>
          <Link 
            href="/login" 
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            Acceso Profesores
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex px-4 py-1.5 bg-purple-50 rounded-full border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest animate-pulse">
              IA Educativa de Próxima Generación
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Tus alumnos, <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600">
                mejor acompañados
              </span> que nunca.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              Crea tutores inteligentes basados en tus propios documentos. Integración nativa con Canvas LMS y control total sobre el conocimiento.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-95 flex items-center gap-2 group"
              >
                Comienza Ahora
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <div className="flex -space-x-3 items-center">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200"></div>
                ))}
                <span className="ml-6 text-sm font-medium text-slate-500 underline underline-offset-4 decoration-purple-300">
                  +150 estudiantes ayudados hoy
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/20 to-indigo-400/20 blur-3xl rounded-full"></div>
            <div className="relative bg-white/40 backdrop-blur-md border border-white/50 p-4 rounded-[2.5rem] shadow-2xl">
              <div className="bg-slate-900 aspect-video rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center group cursor-pointer">
                <div className="text-white text-center group-hover:scale-110 transition-transform">
                  <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-md border border-white/20">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                  </div>
                  <p className="text-sm font-medium">Ver demostración</p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce">
                <span className="text-2xl">📚</span>
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Knowledge Base Active</p>
                    <p className="text-[10px] text-slate-500">Manual APA indexed (420 pages)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Section */}
      <section className="bg-white py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Diseñado para la academia moderna</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale contrast-125">
             <span className="text-2xl font-bold tracking-tighter">CANVAS</span>
             <span className="text-2xl font-bold tracking-tighter">MOODLE</span>
             <span className="text-2xl font-bold tracking-tighter">GRADESCOPE</span>
             <span className="text-2xl font-bold tracking-tighter">ANTHOLOGY</span>
          </div>
        </div>
      </section>
    </div>
  );
}
