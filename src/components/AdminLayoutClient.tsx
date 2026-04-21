"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  orgName: string;
  orgLogo?: string | null;
}

export default function AdminLayoutClient({ children, orgName, orgLogo }: AdminLayoutClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para el móvil

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cerrar sidebar al cambiar de página en móvil
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-semibold italic animate-pulse">Cargando Maestro...</div>;
  }

  if (!session) return null;

  const links = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Analíticas", href: "/admin/analytics", icon: "📈" },
    { name: "Grupos", href: "/admin/groups", icon: "👥" },
    { name: "Bases de Conocimiento", href: "/admin/knowledge", icon: "📚" },
    { name: "Chatbots", href: "/admin/chatbots", icon: "🤖" },
    { name: "Ajustes", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Ahora con comportamiento responsivo */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
              {orgName?.charAt(0) || "M"}
            </div>
            <h1 className="text-sm font-bold truncate max-w-[120px]">{orgName}</h1>
          </div>
          {/* Botón cerrar en móvil */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-purple-600/20 text-purple-300 shadow-sm" : "hover:bg-slate-800 hover:text-white"}`}>
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-center py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all uppercase tracking-widest"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay para cerrar el menú en móvil al tocar fuera */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* BOTÓN HAMBURGUESA (Solo se ve en móvil) */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">
                {pathname === "/admin" ? "Resumen General" : pathname.split('/').pop()?.replace('-', ' ')}
              </h2>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}