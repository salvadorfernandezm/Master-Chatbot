"use client";
import { useState } from "react";

export default function PaginaEmergencia() {
  const [status, setStatus] = useState("Listo para abrir el búnker.");

  const ejecutarCrecion = async () => {
    setStatus("🚀 Procesando en la nube...");
    try {
      const response = await fetch("/api/admin/setup-inicial", { 
        method: "POST" 
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("✅ ¡ÉXITO! Usuario: admin@admin.com | Clave: Salvador123. Ya puedes ir al /login");
      } else {
        setStatus("❌ Fallo: " + data.error);
      }
    } catch (e) {
      setStatus("❌ Error de red.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-10 text-center">
      <h1 className="text-3xl font-bold mb-4 text-purple-400">Reparador de Acceso Maestro</h1>
      <p className="mb-8 text-slate-400">Esta página inyectará a tu usuario "admin@admin.com" con la contraseña "Salvador123" directamente en Supabase desde la nube.</p>
      <button onClick={ejecutarCrecion} className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl font-black transition-all">
        EJECUTAR INYECCIÓN DE ACCESO
      </button>
      <div className="mt-10 p-4 bg-slate-800 rounded-xl font-mono text-lime-400">{status}</div>
    </div>
  );
}