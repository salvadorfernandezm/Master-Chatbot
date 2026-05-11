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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => { setIsSidebarOpen(false); }, [pathname]);

  if (status === "loading") return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold italic animate-pulse tracking-widest uppercase text-xs">Cargando Sistema...</div>;

  if (!session) return null;

  const links = [
    { name: "Resumen", href: "/admin", icon: "📊" },
    { name: "Analíticas", href: "/admin/analytics", icon: "📈" },
    { name: "Buzón Estudiantil", href: "/admin/buzon", icon: "📩" },
    { name: "Grupos", href: "/admin/groups", icon: "👥" },
    { name: "Conocimiento", href: "/admin/knowledge", icon: "📚" },
    { name: "Chatbots", href: "/admin/chatbots", icon: "🤖" },
    { name: "Ajustes", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-400 shadow-2xl flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* RESTAURACIÓN DEL LOGO INSTITUCIONAL */}
             {orgLogo ? (
               <img src={orgLogo} alt="Logo" className="h-10 w-10 object-contain rounded-xl" />
             ) : (
               <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black">{orgName?.charAt(0) || "M"}</div>
             )}
            <h1 className="text-white font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{orgName}</h1>
          </div>
        </div>
        <nav className="flex-1 py-8 px-6 space-y-1">
          {links.map((link) => (
            <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${pathname === link.href ? "bg-white/10 text-white font-bold shadow-inner" : "hover:text-white"}`}>
              <span>{link.icon}</span>
              <span className="text-xs uppercase tracking-widest">{link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
           <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-center py-4 text-[10px] font-black text-red-500 uppercase tracking-[0.3em] hover:bg-red-500/5 rounded-2xl transition-all">Desconectar</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="px-8 py-5 border-b flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">☰</button>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">{pathname === "/admin" ? "Master Panel" : pathname.split('/').pop()}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}