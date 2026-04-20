"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-semibold">Cargando...</div>;
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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {orgLogo ? (
              <img src={orgLogo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                {orgName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 truncate max-w-[140px]">
                {orgName}
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-purple-600/20 text-purple-300 font-medium" : "hover:bg-slate-800 hover:text-white"}`}>
                <span className="text-xl">{link.icon}</span>
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate max-w-40">{session?.user?.name}</p>
              <p className="text-xs text-slate-400 truncate max-w-40">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-10 font-sans">
          <div className="px-8 py-4 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {pathname === "/admin" ? "Resumen General" : pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
